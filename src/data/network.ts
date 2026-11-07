import { EXEC_EVENTS, PAPER_ORDERS, PAPER_TRADES, SIGNALS } from "./paper";
import { STRATEGIES } from "./strategies";

export type NetNodeKind = "core" | "strategy" | "module" | "source" | "job";
export type NetEdgeKind = "data" | "signal" | "order" | "control";

export interface NetNode {
  id: string;
  label: string;
  kind: NetNodeKind;
  ring: 0 | 1 | 2 | 3;
  angle: number;
  status: "active" | "paused" | "idle";
  description: string;
  facts: [string, string][];
}

export interface NetEdge {
  from: string;
  to: string;
  kind: NetEdgeKind;
}

const deg = (d: number) => (d * Math.PI) / 180;
const count = (pred: (k: string) => boolean) => EXEC_EVENTS.filter((e) => pred(e.kind)).length;

const modules: Omit<NetNode, "ring" | "angle" | "kind">[] = [
  { id: "loader", label: "DATA LOADER", status: "active", description: "Reads the DEMO replay dataset and emits normalised bars.", facts: [["Source", "Local file · DEMO"], ["Bars emitted", "68"], ["Gaps", "0"]] },
  { id: "features", label: "FEATURES", status: "active", description: "Computes EMA5, EMA9, VROC(14) and ATR(14) per bar.", facts: [["Indicators", "4"], ["Warm-up", "20 bars"]] },
  { id: "router", label: "SIGNAL ROUTER", status: "active", description: "Collects strategy signals and forwards them to the risk gate.", facts: [["Signals", String(SIGNALS.length)], ["Blocked", String(SIGNALS.filter((s) => s.outcome === "BLOCKED").length)]] },
  { id: "risk", label: "RISK GATE", status: "active", description: "Validates exposure, daily loss and drawdown limits before any order.", facts: [["Passed", String(count((k) => k === "RISK_PASS"))], ["Rejected", String(count((k) => k === "RISK_BLOCK"))], ["Breaches", String(count((k) => k === "LIMIT_BREACH"))]] },
  { id: "oms", label: "ORDER SIM", status: "active", description: "Simulated order management — fills against replay bars. No broker.", facts: [["Orders", String(PAPER_ORDERS.length)], ["Working", String(PAPER_ORDERS.filter((o) => o.status === "WORKING").length)], ["Broker", "None"]] },
  { id: "ledger", label: "LEDGER", status: "active", description: "Tracks simulated positions, fills, fees and P&L.", facts: [["Closed trades", String(PAPER_TRADES.length)], ["Open", "1"]] },
  { id: "log", label: "EVENT LOG", status: "active", description: "Append-only audit trail of every engine event.", facts: [["Events", String(EXEC_EVENTS.length)]] },
];

const sources: Omit<NetNode, "ring" | "angle" | "kind">[] = [
  { id: "es5", label: "ES · 5m", status: "active", description: "E-mini S&P 500 replay bars (DEMO).", facts: [["Feed", "Replay"], ["Bars", "68"]] },
  { id: "nq5", label: "NQ · 5m", status: "active", description: "E-mini Nasdaq-100 replay bars (DEMO).", facts: [["Feed", "Replay"], ["Bars", "68"]] },
  { id: "es1", label: "ES · 1m", status: "idle", description: "Available, not subscribed by any strategy.", facts: [["Feed", "Replay"], ["Subscribers", "0"]] },
  { id: "nq1", label: "NQ · 1m", status: "idle", description: "Available, not subscribed by any strategy.", facts: [["Feed", "Replay"], ["Subscribers", "0"]] },
];

const jobs: Omit<NetNode, "ring" | "angle" | "kind">[] = [
  { id: "bt", label: "BACKTEST", status: "idle", description: "Last completed run BT-2025-10-0142.", facts: [["Status", "Complete"], ["Trades", "≈200"]] },
  { id: "wfa", label: "WALK-FWD", status: "idle", description: "Walk-forward optimisation queue.", facts: [["Queue", "Empty"]] },
  { id: "mc", label: "MONTE CARLO", status: "idle", description: "Trade-sequence resampling jobs.", facts: [["Queue", "Empty"]] },
  { id: "robust", label: "ROBUSTNESS", status: "idle", description: "Parameter sensitivity sweeps.", facts: [["Queue", "Empty"]] },
];

export const NET_NODES: NetNode[] = [
  { id: "core", label: "ENGINE", kind: "core", ring: 0, angle: 0, status: "active", description: "Event loop orchestrating the replay session in paper mode.", facts: [["Mode", "Paper · replay"], ["Session", "2025-10-14 RTH"], ["Broker", "Not connected"]] },
  {
    id: "V1",
    label: "V1 VROC",
    kind: "strategy",
    ring: 1,
    angle: deg(-70),
    status: STRATEGIES.V1.status === "ACTIVE" ? "active" : "paused",
    description: STRATEGIES.V1.statusReason,
    facts: [["Signals", String(SIGNALS.filter((s) => s.strategy === "V1").length)], ["Trades", String(PAPER_TRADES.filter((t) => t.strategy === "V1").length)], ["Status", STRATEGIES.V1.status]],
  },
  {
    id: "V2",
    label: "V2 EMA5/9",
    kind: "strategy",
    ring: 1,
    angle: deg(110),
    status: STRATEGIES.V2.status === "ACTIVE" ? "active" : "paused",
    description: STRATEGIES.V2.statusReason,
    facts: [["Signals", String(SIGNALS.filter((s) => s.strategy === "V2").length)], ["Trades", String(PAPER_TRADES.filter((t) => t.strategy === "V2").length)], ["Status", STRATEGIES.V2.status]],
  },
  ...modules.map((m, i) => ({ ...m, kind: "module" as const, ring: 2 as const, angle: deg(-90 + (360 / modules.length) * i) })),
  ...[...sources, ...jobs].map((m, i) => ({
    ...m,
    kind: (i < sources.length ? "source" : "job") as NetNodeKind,
    ring: 3 as const,
    angle: deg(-112 + 45 * i),
  })),
];

export const NET_EDGES: NetEdge[] = [
  { from: "es5", to: "loader", kind: "data" },
  { from: "nq5", to: "loader", kind: "data" },
  { from: "loader", to: "features", kind: "data" },
  { from: "features", to: "V1", kind: "data" },
  { from: "features", to: "V2", kind: "data" },
  { from: "V1", to: "router", kind: "signal" },
  { from: "V2", to: "router", kind: "signal" },
  { from: "router", to: "risk", kind: "signal" },
  { from: "risk", to: "oms", kind: "order" },
  { from: "oms", to: "ledger", kind: "order" },
  { from: "ledger", to: "log", kind: "order" },
  { from: "core", to: "V1", kind: "control" },
  { from: "core", to: "V2", kind: "control" },
  { from: "bt", to: "core", kind: "control" },
  { from: "wfa", to: "core", kind: "control" },
  { from: "mc", to: "core", kind: "control" },
  { from: "robust", to: "core", kind: "control" },
];
