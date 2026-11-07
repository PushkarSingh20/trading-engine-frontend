import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Segmented, Select } from "@/components/ui/controls";
import { StatusDot } from "@/components/ui/tags";
import { INSTRUMENTS } from "@/data/backtest";
import { REPLAY_SESSION } from "@/data/paper";
import type { InstrumentId, StrategyFilter, Timeframe } from "@/data/types";
import { useWorkspace } from "@/state/workspace";

function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full shrink-0 items-center gap-2 border-r border-line px-3 ${className}`}>
      <span className="label-caps text-dim">{label}</span>
      {children}
    </div>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { strategy, instrument, timeframe, setStrategy, setInstrument, setTimeframe } = useWorkspace();

  return (
    <header className="flex h-11 shrink-0 items-stretch border-b border-line bg-surface">
      <button
        type="button"
        onClick={onMenu}
        className="flex w-11 shrink-0 items-center justify-center border-r border-line text-muted hover:text-fg lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </button>
      <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
        <Cell label="App">
          <StatusDot tone="pos" />
          <span className="num text-2xs text-fg">RESEARCH MODE</span>
        </Cell>
        <Cell label="Data">
          <StatusDot tone="accent" />
          <span className="num text-2xs text-fg">DEMO DATASET</span>
          <span className="num hidden text-2xs text-dim xl:inline">· static · no live feed</span>
        </Cell>
        <Cell label="Strategy">
          <label className="sr-only" htmlFor="tb-strategy">
            Selected strategy
          </label>
          <Select id="tb-strategy" value={strategy} onChange={(e) => setStrategy(e.target.value as StrategyFilter)}>
            <option value="ALL">All strategies</option>
            <option value="V1">V1 · VROC</option>
            <option value="V2">V2 · EMA5/9</option>
          </Select>
        </Cell>
        <Cell label="Instrument">
          <label className="sr-only" htmlFor="tb-instrument">
            Selected instrument
          </label>
          <Select id="tb-instrument" value={instrument} onChange={(e) => setInstrument(e.target.value as InstrumentId)}>
            {Object.values(INSTRUMENTS).map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} · {i.name}
              </option>
            ))}
          </Select>
        </Cell>
        <Cell label="TF">
          <Segmented<Timeframe>
            label="Timeframe"
            value={timeframe}
            onChange={setTimeframe}
            options={(["1m", "5m", "15m", "1h"] as Timeframe[]).map((t) => ({ value: t, label: t }))}
          />
        </Cell>
        <Cell label="Session" className="ml-auto border-l border-r-0">
          <StatusDot tone="info" />
          <span className="num text-2xs text-fg">{REPLAY_SESSION.label}</span>
          <span className="num text-2xs text-dim">@ {REPLAY_SESSION.cursor} ET</span>
        </Cell>
      </div>
    </header>
  );
}
