import { INSTRUMENTS } from "./backtest";
import { gaussian, hashString, mulberry32, pad2, roundToTick } from "./random";
import type { Bar, ChartSignal, InstrumentId, Timeframe } from "./types";

const STEP_MIN: Record<Timeframe, number> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60 };

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

const cache = new Map<string, { bars: Bar[]; signals: ChartSignal[] }>();

export function getReplayBars(instrument: InstrumentId, timeframe: Timeframe, count = 110) {
  const key = `${instrument}:${timeframe}:${count}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const inst = INSTRUMENTS[instrument];
  const rand = mulberry32(hashString(key));
  const step = STEP_MIN[timeframe];
  const vol = inst.base * 0.00085 * Math.sqrt(step / 5);
  const raw: Omit<Bar, "ema5" | "ema9" | "vroc">[] = [];
  let price = inst.base;
  let regime = 0;
  let sessionMin = 0;
  let day = 14;

  for (let i = 0; i < count; i++) {
    if (i % 24 === 0) regime = gaussian(rand) * vol * 0.35;
    const open = price;
    const close = open + regime + gaussian(rand) * vol;
    const high = Math.max(open, close) + Math.abs(gaussian(rand)) * vol * 0.55;
    const low = Math.min(open, close) - Math.abs(gaussian(rand)) * vol * 0.55;
    const spike = rand() < 0.07 ? 2.4 + rand() : 1;
    const volume = Math.round(1600 * (step / 5) * (0.7 + Math.abs(gaussian(rand)) * 0.5) * spike);
    const total = 9 * 60 + 30 + sessionMin;
    const label = step >= 60 ? `Oct ${day} ${pad2(Math.floor(total / 60))}:${pad2(total % 60)}` : `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
    raw.push({
      i,
      label,
      open: roundToTick(open, inst.tick),
      high: roundToTick(high, inst.tick),
      low: roundToTick(low, inst.tick),
      close: roundToTick(close, inst.tick),
      volume,
    });
    price = close;
    sessionMin += step;
    if (sessionMin >= 390) {
      sessionMin = 0;
      day++;
    }
  }

  const closes = raw.map((b) => b.close);
  const e5 = ema(closes, 5);
  const e9 = ema(closes, 9);
  const bars: Bar[] = raw.map((b, i) => {
    const prev = raw[i - 14]?.volume;
    return { ...b, ema5: e5[i], ema9: e9[i], vroc: prev ? ((b.volume - prev) / prev) * 100 : 0 };
  });

  const signals: ChartSignal[] = [];
  let lastV1 = -10;
  let lastV2 = -10;
  for (let i = 10; i < bars.length; i++) {
    const b = bars[i];
    const p = bars[i - 1];
    const crossUp = p.ema5 <= p.ema9 && b.ema5 > b.ema9;
    const crossDown = p.ema5 >= p.ema9 && b.ema5 < b.ema9;
    if ((crossUp || crossDown) && i - lastV2 >= 5) {
      signals.push({ i, strategy: "V2", side: crossUp ? "LONG" : "SHORT", price: b.close });
      lastV2 = i;
    }
    if (b.vroc > 60 && Math.abs(b.close - b.open) > vol * 0.6 && i - lastV1 >= 6) {
      signals.push({ i, strategy: "V1", side: b.close > b.open ? "LONG" : "SHORT", price: b.close });
      lastV1 = i;
    }
  }

  const result = { bars, signals };
  cache.set(key, result);
  return result;
}
