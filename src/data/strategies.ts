import { PAPER_POSITIONS, strategyDayLoss } from "./paper";
import type { StrategyDef, StrategyId } from "./types";

const v2Loss = Math.abs(Math.min(0, strategyDayLoss("V2")));
const v1Loss = Math.abs(Math.min(0, strategyDayLoss("V1")));

export const STRATEGIES: Record<StrategyId, StrategyDef> = {
  V1: {
    id: "V1",
    name: "V1 · VROC Momentum",
    short: "VROC",
    status: "ACTIVE",
    statusReason: "Paper execution · within limits",
    description:
      "Enters in the direction of the signal bar when the 14-period Volume Rate of Change exceeds 60% and price breaks the prior 20-bar range. Bracket exit at 2.5R target or 1.2×ATR stop.",
    parameters: [
      ["VROC period", "14"],
      ["VROC threshold", "60%"],
      ["Range lookback", "20 bars"],
      ["Stop", "1.2 × ATR(14)"],
      ["Target", "2.5 R"],
      ["Max hold", "24 bars"],
      ["Session filter", "09:35–15:45 ET"],
    ],
    riskLimits: [
      { label: "Daily loss", used: v1Loss, limit: 1500, unit: "usd" },
      { label: "Position size", used: PAPER_POSITIONS.filter((p) => p.strategy === "V1").reduce((s, p) => s + p.qty, 0), limit: 2, unit: "contracts" },
      { label: "Open trades", used: PAPER_POSITIONS.filter((p) => p.strategy === "V1").length, limit: 3, unit: "count" },
      { label: "Strategy drawdown", used: 0.031, limit: 0.08, unit: "pct" },
    ],
    instruments: ["ES", "NQ"],
    timeframe: "5m",
  },
  V2: {
    id: "V2",
    name: "V2 · EMA5/EMA9 Reversal",
    short: "EMA X",
    status: "PAUSED",
    statusReason: "Daily loss limit breached at 12:26",
    description:
      "Fades short-term exhaustion: enters on an EMA5/EMA9 cross confirmed by a close beyond the slow EMA. Stop beyond the most recent swing extreme, 1.5R target, time exit after 12 bars.",
    parameters: [
      ["Fast EMA", "5"],
      ["Slow EMA", "9"],
      ["Confirmation", "1 bar close"],
      ["Stop", "Swing extreme + 1 tick"],
      ["Target", "1.5 R"],
      ["Max hold", "12 bars"],
      ["Session filter", "09:45–15:30 ET"],
    ],
    riskLimits: [
      { label: "Daily loss", used: v2Loss, limit: 1000, unit: "usd" },
      { label: "Position size", used: 0, limit: 1, unit: "contracts" },
      { label: "Open trades", used: 0, limit: 2, unit: "count" },
      { label: "Strategy drawdown", used: 0.054, limit: 0.06, unit: "pct" },
    ],
    instruments: ["ES", "NQ"],
    timeframe: "5m",
  },
};

export const STRATEGY_LIST = [STRATEGIES.V1, STRATEGIES.V2];
