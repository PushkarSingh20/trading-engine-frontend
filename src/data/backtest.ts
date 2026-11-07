import { gaussian, mulberry32, pad2, roundToTick } from "./random";
import type { BacktestTrade, EquityPoint, InstrumentId, Instrument, Metrics, StrategyFilter, StrategyId } from "./types";

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  ES: { id: "ES", name: "E-mini S&P 500", multiplier: 50, tick: 0.25, base: 5418 },
  NQ: { id: "NQ", name: "E-mini Nasdaq-100", multiplier: 20, tick: 0.25, base: 19050 },
};

export const BACKTEST_CONFIG = {
  id: "BT-2025-10-0142",
  window: ["2024-01-02", "2025-09-30"] as const,
  instruments: ["ES", "NQ"] as InstrumentId[],
  timeframe: "5m",
  startingEquity: 100_000,
  riskPerTrade: 500,
  commission: 4.5,
  slippage: "1 tick / side",
  fillModel: "Next-bar open",
  dataset: "DEMO · synthetic OHLCV",
};

const DAY = 86_400_000;

function isoDate(ms: number) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function sessionTime(minutesFromOpen: number) {
  const total = 9 * 60 + 30 + minutesFromOpen;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function generateTrades(): BacktestTrade[] {
  const rand = mulberry32(7);
  const trades: BacktestTrade[] = [];
  const start = Date.UTC(2024, 0, 2);
  const end = Date.UTC(2025, 8, 30);
  let id = 1;
  let drift = { ES: 4750, NQ: 16800 };

  for (let day = start; day <= end; day += DAY) {
    const dow = new Date(day).getUTCDay();
    if (dow === 0 || dow === 6) continue;
    drift = { ES: drift.ES * (1 + 0.0007 + gaussian(rand) * 0.008), NQ: drift.NQ * (1 + 0.0008 + gaussian(rand) * 0.011) };

    for (const strategy of ["V1", "V2"] as StrategyId[]) {
      const freq = strategy === "V1" ? 0.19 : 0.26;
      if (rand() > freq) continue;
      const isV1 = strategy === "V1";
      const win = rand() < (isV1 ? 0.41 : 0.54);
      const r = win
        ? isV1
          ? 1.15 + Math.abs(gaussian(rand)) * 0.95
          : 0.85 + Math.abs(gaussian(rand)) * 0.42
        : -(0.72 + rand() * 0.34);
      const instrument: InstrumentId = rand() < 0.64 ? "ES" : "NQ";
      const inst = INSTRUMENTS[instrument];
      const side = rand() < 0.53 ? "LONG" : "SHORT";
      const qty = rand() < 0.75 ? 1 : 2;
      const stopPts = BACKTEST_CONFIG.riskPerTrade / (inst.multiplier * qty);
      const entry = roundToTick(drift[instrument] * (1 + gaussian(rand) * 0.002), inst.tick);
      const dir = side === "LONG" ? 1 : -1;
      const exit = roundToTick(entry + dir * r * stopPts, inst.tick);
      const gross = (exit - entry) * dir * inst.multiplier * qty;
      const pnl = Math.round((gross - BACKTEST_CONFIG.commission * qty) * 100) / 100;
      const entryMin = Math.floor(rand() * 300) + 5;
      const bars = Math.max(2, Math.round((isV1 ? 9 : 5) + gaussian(rand) * 3));
      trades.push({
        id: id++,
        strategy,
        instrument,
        side,
        date: isoDate(day),
        entryTime: sessionTime(entryMin),
        exitTime: sessionTime(Math.min(385, entryMin + bars * 5)),
        entry,
        exit,
        qty,
        r: Math.round((pnl / BACKTEST_CONFIG.riskPerTrade) * 100) / 100,
        pnl,
        bars,
      });
    }
  }
  return trades;
}

export const BACKTEST_TRADES = generateTrades();

export function filterTrades(trades: BacktestTrade[], strategy: StrategyFilter) {
  return strategy === "ALL" ? trades : trades.filter((t) => t.strategy === strategy);
}

export function buildEquity(trades: BacktestTrade[], startEquity = BACKTEST_CONFIG.startingEquity): EquityPoint[] {
  const byDate = new Map<string, { v1: number; v2: number }>();
  for (const t of trades) {
    const cur = byDate.get(t.date) ?? { v1: 0, v2: 0 };
    if (t.strategy === "V1") cur.v1 += t.pnl;
    else cur.v2 += t.pnl;
    byDate.set(t.date, cur);
  }
  const points: EquityPoint[] = [{ date: BACKTEST_CONFIG.window[0], equity: startEquity, drawdown: 0, v1: 0, v2: 0 }];
  let v1 = 0;
  let v2 = 0;
  let peak = startEquity;
  for (const [date, day] of [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    v1 += day.v1;
    v2 += day.v2;
    const equity = startEquity + v1 + v2;
    peak = Math.max(peak, equity);
    points.push({ date, equity: Math.round(equity), drawdown: (equity - peak) / peak, v1: Math.round(v1), v2: Math.round(v2) });
  }
  return points;
}

export function computeMetrics(trades: BacktestTrade[] | { pnl: number; r?: number; bars?: number }[]): Metrics {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = grossProfit - grossLoss;
  const n = trades.length || 1;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;

  let equity = BACKTEST_CONFIG.startingEquity;
  let peak = equity;
  let maxDd = 0;
  let maxDdPct = 0;
  for (const t of trades) {
    equity += t.pnl;
    peak = Math.max(peak, equity);
    maxDd = Math.max(maxDd, peak - equity);
    maxDdPct = Math.max(maxDdPct, (peak - equity) / peak);
  }

  return {
    trades: trades.length,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss ? grossProfit / grossLoss : 0,
    winRate: wins.length / n,
    expectancy: netPnl / n,
    expectancyR: netPnl / n / BACKTEST_CONFIG.riskPerTrade,
    avgWin,
    avgLoss,
    riskReward: avgLoss ? avgWin / avgLoss : 0,
    maxDrawdown: maxDd,
    maxDrawdownPct: maxDdPct,
    recoveryFactor: maxDd ? netPnl / maxDd : 0,
    avgBars: trades.reduce((s, t) => s + ("bars" in t && t.bars ? t.bars : 0), 0) / n,
    largestWin: wins.reduce((m, t) => Math.max(m, t.pnl), 0),
    largestLoss: losses.reduce((m, t) => Math.min(m, t.pnl), 0),
  };
}

export interface MonthlyReturn {
  year: number;
  month: number;
  pnl: number;
  ret: number;
}

export function monthlyReturns(trades: BacktestTrade[]): MonthlyReturn[] {
  const buckets = new Map<string, number>();
  for (const t of trades) {
    const key = t.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + t.pnl);
  }
  let equity = BACKTEST_CONFIG.startingEquity;
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, pnl]) => {
      const ret = pnl / equity;
      equity += pnl;
      const [y, m] = key.split("-").map(Number);
      return { year: y, month: m, pnl, ret };
    });
}

export function rDistribution(trades: BacktestTrade[]) {
  const edges = [-1.25, -1, -0.75, -0.5, -0.25, 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
  const bins = edges.slice(0, -1).map((lo, i) => ({ lo, hi: edges[i + 1], label: `${lo.toFixed(2)}`, count: 0 }));
  for (const t of trades) {
    const r = Math.min(Math.max(t.r, edges[0]), edges[edges.length - 1] - 0.001);
    const bin = bins.find((b) => r >= b.lo && r < b.hi);
    if (bin) bin.count++;
  }
  return bins.map((b) => ({ ...b, label: `${b.lo >= 0 ? "+" : ""}${b.lo}R` }));
}
