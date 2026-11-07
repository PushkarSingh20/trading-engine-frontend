import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { InstrumentId, StrategyFilter, Timeframe } from "@/data/types";

interface WorkspaceState {
  strategy: StrategyFilter;
  instrument: InstrumentId;
  timeframe: Timeframe;
  setStrategy: (s: StrategyFilter) => void;
  setInstrument: (i: InstrumentId) => void;
  setTimeframe: (t: Timeframe) => void;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<StrategyFilter>("ALL");
  const [instrument, setInstrument] = useState<InstrumentId>("ES");
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const value = useMemo(
    () => ({ strategy, instrument, timeframe, setStrategy, setInstrument, setTimeframe }),
    [strategy, instrument, timeframe],
  );
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
