import {
  Activity,
  BarChart3,
  Database,
  FlaskConical,
  GitBranch,
  LayoutGrid,
  ListOrdered,
  Settings,
  ShieldAlert,
  Shuffle,
  Sigma,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  code: string;
  inConcept?: boolean;
}

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Research",
    items: [
      { to: "/", label: "Overview", icon: LayoutGrid, code: "OVR", inConcept: true },
      { to: "/strategies", label: "Strategies", icon: GitBranch, code: "STR", inConcept: true },
      { to: "/market-data", label: "Market Data", icon: Database, code: "MKT" },
      { to: "/backtesting", label: "Backtesting", icon: FlaskConical, code: "BT", inConcept: true },
      { to: "/walk-forward", label: "Walk-Forward Analysis", icon: BarChart3, code: "WFA" },
      { to: "/robustness", label: "Robustness Analysis", icon: Sigma, code: "RBS" },
      { to: "/monte-carlo", label: "Monte Carlo", icon: Shuffle, code: "MC" },
    ],
  },
  {
    label: "Simulation",
    items: [
      { to: "/paper-trading", label: "Paper Trading", icon: Activity, code: "PPR", inConcept: true },
      { to: "/positions", label: "Positions and Trades", icon: ListOrdered, code: "POS" },
      { to: "/risk", label: "Risk Monitor", icon: ShieldAlert, code: "RSK" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/logs", label: "System Logs", icon: Terminal, code: "LOG" },
      { to: "/settings", label: "Settings", icon: Settings, code: "SET" },
    ],
  },
];

export const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);
