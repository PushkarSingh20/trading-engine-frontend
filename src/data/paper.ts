import { INSTRUMENTS } from "./backtest";
import { gaussian, mulberry32, pad2 } from "./random";
import type { ExecEvent, PaperPosition, PaperTrade, SignalRecord, SimOrder, StrategyId } from "./types";

export const REPLAY_SESSION = {
  date: "2025-10-14",
  label: "RTH replay · 2025-10-14",
  open: "09:30",
  close: "16:00",
  cursor: "15:10",
};

const FEE = 4.5;

type TradeSeed = Omit<PaperTrade, "id" | "gross" | "fees" | "net">;

const seeds: TradeSeed[] = [
  { strategy: "V1", instrument: "ES", side: "LONG", qty: 1, entryTime: "09:42", exitTime: "10:05", entry: 5409.5, exit: 5417.25, exitReason: "TARGET" },
  { strategy: "V2", instrument: "ES", side: "SHORT", qty: 1, entryTime: "10:12", exitTime: "10:31", entry: 5421.0, exit: 5426.0, exitReason: "STOP" },
  { strategy: "V1", instrument: "NQ", side: "SHORT", qty: 1, entryTime: "10:48", exitTime: "11:20", entry: 19118.0, exit: 19097.25, exitReason: "TARGET" },
  { strategy: "V2", instrument: "ES", side: "LONG", qty: 1, entryTime: "11:35", exitTime: "11:52", entry: 5419.25, exit: 5414.5, exitReason: "STOP" },
  { strategy: "V2", instrument: "NQ", side: "LONG", qty: 1, entryTime: "12:10", exitTime: "12:26", entry: 19092.0, exit: 19066.0, exitReason: "STOP" },
  { strategy: "V1", instrument: "ES", side: "SHORT", qty: 1, entryTime: "13:05", exitTime: "13:44", entry: 5416.75, exit: 5412.25, exitReason: "TIME" },
  { strategy: "V1", instrument: "ES", side: "LONG", qty: 2, entryTime: "14:02", exitTime: "14:31", entry: 5411.0, exit: 5408.75, exitReason: "STOP" },
];

export const PAPER_TRADES: PaperTrade[] = seeds.map((s, idx) => {
  const dir = s.side === "LONG" ? 1 : -1;
  const gross = (s.exit - s.entry) * dir * INSTRUMENTS[s.instrument].multiplier * s.qty;
  const fees = FEE * s.qty;
  return { ...s, id: `PT-${pad2(idx + 1)}`, gross, fees, net: gross - fees };
});

export const PAPER_POSITIONS: PaperPosition[] = [
  {
    strategy: "V1",
    instrument: "ES",
    side: "LONG",
    qty: 1,
    entry: 5418.25,
    mark: 5424.5,
    openedAt: "14:47",
    stop: 5409.0,
    target: 5440.75,
    unrealized: (5424.5 - 5418.25) * 50,
  },
];

export const PAPER_ORDERS: SimOrder[] = (() => {
  const orders: SimOrder[] = [];
  let n = 1;
  const id = () => `SO-${String(n++).padStart(4, "0")}`;
  for (const t of PAPER_TRADES) {
    const entryAction = t.side === "LONG" ? "BUY" : "SELL";
    const exitAction = t.side === "LONG" ? "SELL" : "BUY";
    orders.push({ id: id(), time: t.entryTime, strategy: t.strategy, instrument: t.instrument, action: entryAction, type: "MKT", qty: t.qty, price: null, fillPrice: t.entry, status: "FILLED", tag: "ENTRY" });
    const filledLeg = t.exitReason === "STOP" ? "STP" : "LMT";
    orders.push({ id: id(), time: t.exitTime, strategy: t.strategy, instrument: t.instrument, action: exitAction, type: t.exitReason === "TIME" ? "MKT" : filledLeg, qty: t.qty, price: t.exitReason === "TIME" ? null : t.exit, fillPrice: t.exit, status: "FILLED", tag: t.exitReason === "TIME" ? "TIME EXIT" : `OCO ${filledLeg === "STP" ? "STOP" : "TARGET"}` });
    orders.push({ id: id(), time: t.exitTime, strategy: t.strategy, instrument: t.instrument, action: exitAction, type: filledLeg === "STP" ? "LMT" : "STP", qty: t.qty, price: null, fillPrice: null, status: "CANCELLED", tag: "OCO SIBLING" });
  }
  orders.push({ id: id(), time: "13:40", strategy: "V2", instrument: "ES", action: "BUY", type: "MKT", qty: 1, price: null, fillPrice: null, status: "REJECTED", tag: "RISK GATE" });
  const p = PAPER_POSITIONS[0];
  orders.push({ id: id(), time: p.openedAt, strategy: p.strategy, instrument: p.instrument, action: "BUY", type: "MKT", qty: p.qty, price: null, fillPrice: p.entry, status: "FILLED", tag: "ENTRY" });
  orders.push({ id: id(), time: p.openedAt, strategy: p.strategy, instrument: p.instrument, action: "SELL", type: "STP", qty: p.qty, price: p.stop, fillPrice: null, status: "WORKING", tag: "OCO STOP" });
  orders.push({ id: id(), time: p.openedAt, strategy: p.strategy, instrument: p.instrument, action: "SELL", type: "LMT", qty: p.qty, price: p.target, fillPrice: null, status: "WORKING", tag: "OCO TARGET" });
  return orders.sort((a, b) => b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
})();

function minusMinute(time: string, m: number) {
  const [h, mm] = time.split(":").map(Number);
  const total = h * 60 + mm - m;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

export const SIGNALS: SignalRecord[] = ([
  ...PAPER_TRADES.map<SignalRecord>((t) => ({
    id: `SG-${t.id}`,
    time: minusMinute(t.entryTime, 0),
    strategy: t.strategy,
    instrument: t.instrument,
    side: t.side,
    trigger: t.strategy === "V1" ? "VROC(14) > 60% · range break" : `EMA5 ${t.side === "LONG" ? "↑" : "↓"} EMA9 · close confirm`,
    price: t.entry,
    outcome: "EXECUTED",
    note: `${t.qty} ct · stop ${t.strategy === "V1" ? "1.2 ATR" : "swing"}`,
  })),
  { id: "SG-B1", time: "13:40", strategy: "V2", instrument: "ES", side: "LONG", trigger: "EMA5 ↑ EMA9 · close confirm", price: 5413.75, outcome: "BLOCKED", note: "Daily loss limit reached" },
  { id: "SG-B2", time: "14:55", strategy: "V2", instrument: "NQ", side: "SHORT", trigger: "EMA5 ↓ EMA9 · close confirm", price: 19071.5, outcome: "BLOCKED", note: "Strategy paused" },
  { id: "SG-P1", time: PAPER_POSITIONS[0].openedAt, strategy: "V1", instrument: "ES", side: "LONG", trigger: "VROC(14) > 60% · range break", price: PAPER_POSITIONS[0].entry, outcome: "EXECUTED", note: "1 ct · stop 1.2 ATR" },
] satisfies SignalRecord[]).sort((a, b) => b.time.localeCompare(a.time));

export const EXEC_EVENTS: ExecEvent[] = (() => {
  const events: ExecEvent[] = [{ id: "E0", time: "09:30:00", kind: "SESSION", message: "Replay session opened · paper mode · broker: none" }];
  let n = 1;
  const push = (time: string, kind: ExecEvent["kind"], message: string, strategy?: StrategyId) => events.push({ id: `E${n++}`, time, kind, message, strategy });
  let v2Loss = 0;
  for (const t of PAPER_TRADES) {
    const act = t.side === "LONG" ? "BUY" : "SELL";
    push(`${t.entryTime}:00`, "SIGNAL", `${t.side} ${t.instrument} @ ${t.entry.toFixed(2)}`, t.strategy);
    push(`${t.entryTime}:00`, "RISK_PASS", `Exposure ${t.qty}/${t.strategy === "V1" ? 2 : 1} ct · daily loss OK`, t.strategy);
    push(`${t.entryTime}:01`, "FILL", `${act} ${t.qty} ${t.instrument} @ ${t.entry.toFixed(2)} (sim)`, t.strategy);
    push(`${t.exitTime}:00`, "FILL", `${t.exitReason} exit ${t.instrument} @ ${t.exit.toFixed(2)} · net ${t.net >= 0 ? "+" : ""}${t.net.toFixed(2)}`, t.strategy);
    push(`${t.exitTime}:00`, "CANCEL", `OCO sibling cancelled`, t.strategy);
    if (t.strategy === "V2") {
      v2Loss += t.net;
      if (v2Loss <= -1000) {
        push(`${t.exitTime}:01`, "LIMIT_BREACH", `Daily loss ${v2Loss.toFixed(2)} ≤ -1,000.00 limit`, "V2");
        push(`${t.exitTime}:01`, "STRATEGY_PAUSED", "V2 halted until next session", "V2");
      }
    }
  }
  push("13:40:00", "RISK_BLOCK", "LONG ES rejected · strategy paused", "V2");
  push("14:47:00", "SIGNAL", "LONG ES @ 5418.25", "V1");
  push("14:47:00", "RISK_PASS", "Exposure 1/2 ct · daily loss OK", "V1");
  push("14:47:01", "FILL", "BUY 1 ES @ 5418.25 (sim)", "V1");
  push("14:47:01", "ORDER_SUBMIT", "OCO STP 5409.00 / LMT 5440.75", "V1");
  push("14:55:00", "RISK_BLOCK", "SHORT NQ rejected · strategy paused", "V2");
  return events.sort((a, b) => b.time.localeCompare(a.time) || Number(b.id.slice(1)) - Number(a.id.slice(1)));
})();

export const PAPER_PNL_SERIES = (() => {
  const rand = mulberry32(99);
  const points: { time: string; pnl: number; drawdown: number }[] = [];
  let peak = 0;
  for (let m = 0; m <= 340; m += 5) {
    const total = 9 * 60 + 30 + m;
    const time = `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
    const realized = PAPER_TRADES.filter((t) => t.exitTime <= time).reduce((s, t) => s + t.net, 0);
    const open = PAPER_TRADES.find((t) => t.entryTime <= time && t.exitTime > time);
    const pos = PAPER_POSITIONS[0];
    let unreal = 0;
    if (open) unreal = open.net * 0.5 + gaussian(rand) * 60;
    if (time >= pos.openedAt) unreal = pos.unrealized * Math.min(1, (m - 317) / 23) + gaussian(rand) * 30;
    const pnl = Math.round(realized + unreal);
    peak = Math.max(peak, pnl);
    points.push({ time, pnl, drawdown: pnl - peak });
  }
  return points;
})();

export function paperSummary() {
  const realized = PAPER_TRADES.reduce((s, t) => s + t.net, 0);
  const unrealized = PAPER_POSITIONS.reduce((s, p) => s + p.unrealized, 0);
  const fees = PAPER_TRADES.reduce((s, t) => s + t.fees, 0) + PAPER_POSITIONS.reduce((s, p) => s + p.qty * FEE * 0.5, 0);
  const maxDd = PAPER_PNL_SERIES.reduce((m, p) => Math.min(m, p.drawdown), 0);
  const wins = PAPER_TRADES.filter((t) => t.net > 0).length;
  return { realized, unrealized, net: realized + unrealized, fees, maxDd, trades: PAPER_TRADES.length, wins, open: PAPER_POSITIONS.length };
}

export function strategyDayLoss(strategy: StrategyId) {
  return PAPER_TRADES.filter((t) => t.strategy === strategy).reduce((s, t) => s + t.net, 0);
}
