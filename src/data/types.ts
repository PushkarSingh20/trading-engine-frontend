export type StrategyId = "V1" | "V2";
export type StrategyFilter = StrategyId | "ALL";
export type InstrumentId = "ES" | "NQ";
export type Timeframe = "1m" | "5m" | "15m" | "1h";
export type Side = "LONG" | "SHORT";

export interface Instrument {
  id: InstrumentId;
  name: string;
  multiplier: number;
  tick: number;
  base: number;
}

export interface BacktestTrade {
  id: number;
  strategy: StrategyId;
  instrument: InstrumentId;
  side: Side;
  date: string;
  entryTime: string;
  exitTime: string;
  entry: number;
  exit: number;
  qty: number;
  r: number;
  pnl: number;
  bars: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
  v1: number;
  v2: number;
}

export interface Metrics {
  trades: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  winRate: number;
  expectancy: number;
  expectancyR: number;
  avgWin: number;
  avgLoss: number;
  riskReward: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  recoveryFactor: number;
  avgBars: number;
  largestWin: number;
  largestLoss: number;
}

export interface Bar {
  i: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema5: number;
  ema9: number;
  vroc: number;
}

export interface ChartSignal {
  i: number;
  strategy: StrategyId;
  side: Side;
  price: number;
}

export type StrategyStatus = "ACTIVE" | "PAUSED" | "DISABLED";

export interface RiskLimit {
  label: string;
  used: number;
  limit: number;
  unit: "usd" | "count" | "pct" | "contracts";
}

export interface StrategyDef {
  id: StrategyId;
  name: string;
  short: string;
  status: StrategyStatus;
  statusReason: string;
  description: string;
  parameters: [string, string][];
  riskLimits: RiskLimit[];
  instruments: InstrumentId[];
  timeframe: Timeframe;
}

export interface PaperTrade {
  id: string;
  strategy: StrategyId;
  instrument: InstrumentId;
  side: Side;
  qty: number;
  entryTime: string;
  exitTime: string;
  entry: number;
  exit: number;
  gross: number;
  fees: number;
  net: number;
  exitReason: "TARGET" | "STOP" | "TIME" | "SIGNAL";
}

export interface PaperPosition {
  strategy: StrategyId;
  instrument: InstrumentId;
  side: Side;
  qty: number;
  entry: number;
  mark: number;
  openedAt: string;
  stop: number;
  target: number;
  unrealized: number;
}

export type OrderStatus = "WORKING" | "FILLED" | "CANCELLED" | "REJECTED";

export interface SimOrder {
  id: string;
  time: string;
  strategy: StrategyId;
  instrument: InstrumentId;
  action: "BUY" | "SELL";
  type: "MKT" | "LMT" | "STP";
  qty: number;
  price: number | null;
  fillPrice: number | null;
  status: OrderStatus;
  tag: string;
}

export type EventKind =
  | "SIGNAL"
  | "RISK_PASS"
  | "RISK_BLOCK"
  | "ORDER_SUBMIT"
  | "FILL"
  | "CANCEL"
  | "LIMIT_BREACH"
  | "STRATEGY_PAUSED"
  | "SESSION";

export interface ExecEvent {
  id: string;
  time: string;
  kind: EventKind;
  strategy?: StrategyId;
  message: string;
}

export interface SignalRecord {
  id: string;
  time: string;
  strategy: StrategyId;
  instrument: InstrumentId;
  side: Side;
  trigger: string;
  price: number;
  outcome: "EXECUTED" | "BLOCKED";
  note: string;
}
