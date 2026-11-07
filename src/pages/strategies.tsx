import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { PageGrid, PageHeader } from "@/components/layout/page-header";
import { RiskLimits } from "@/components/domain/risk-limits";
import { SignalsTable } from "@/components/domain/signals-table";
import { Segmented } from "@/components/ui/controls";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Panel } from "@/components/ui/panel";
import { DemoTag, StrategyStatusBadge } from "@/components/ui/tags";
import { MarketChart } from "@/components/viz/market-chart";
import { BACKTEST_TRADES, buildEquity, computeMetrics, filterTrades } from "@/data/backtest";
import { getReplayBars } from "@/data/market";
import { PAPER_TRADES, SIGNALS } from "@/data/paper";
import { STRATEGY_LIST } from "@/data/strategies";
import type { StrategyDef, StrategyFilter } from "@/data/types";
import { useDatasetLoading } from "@/lib/hooks";
import { CHART_COLORS as C, fmtNum, fmtPct, fmtUsd, toneClass } from "@/lib/utils";
import { useWorkspace } from "@/state/workspace";

function StrategyCard({ def, loading }: { def: StrategyDef; loading: boolean }) {
  const bt = useMemo(() => {
    const t = filterTrades(BACKTEST_TRADES, def.id);
    return { m: computeMetrics(t), eq: buildEquity(t) };
  }, [def.id]);
  const today = PAPER_TRADES.filter((t) => t.strategy === def.id);
  const todayNet = today.reduce((s, t) => s + t.net, 0);
  const sigs = SIGNALS.filter((s) => s.strategy === def.id);
  const color = def.id === "V1" ? C.accent : C.info;

  return (
    <Panel title={def.name} subtitle={`${def.instruments.join(" / ")} · ${def.timeframe}`} loading={loading} className="col-span-12 lg:col-span-6" actions={<StrategyStatusBadge status={def.status} />}>
      <div className="flex flex-col">
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed text-muted text-pretty">{def.description}</p>
            <p className={`num mt-2 text-2xs ${def.status === "PAUSED" ? "text-accent" : "text-dim"}`}>STATUS · {def.statusReason}</p>
          </div>
          <div className="h-20 w-full shrink-0 border border-line sm:w-48" aria-label={`${def.id} backtest equity sparkline`} role="img">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bt.eq} margin={{ top: 6, right: 4, bottom: 6, left: 4 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} dataKey={def.id === "V1" ? "v1" : "v2"} />
                <Line dataKey={def.id === "V1" ? "v1" : "v2"} stroke={color} dot={false} strokeWidth={1.25} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <MetricGrid label={`${def.id} metrics`} className="grid-cols-2 border-b border-line sm:grid-cols-4">
          <Metric label="BT trades" value={bt.m.trades} hint={`win ${fmtPct(bt.m.winRate, 0)}`} />
          <Metric label="BT expectancy" value={`${fmtNum(bt.m.expectancyR)}R`} tone={toneClass(bt.m.expectancyR)} hint={`PF ${fmtNum(bt.m.profitFactor)}`} />
          <Metric label="Session P&L" value={fmtUsd(todayNet, { signed: true })} tone={toneClass(todayNet)} hint={`${today.length} paper trades`} />
          <Metric label="Signals" value={sigs.length} hint={`${sigs.filter((s) => s.outcome === "BLOCKED").length} blocked`} />
        </MetricGrid>

        <div className="grid gap-px bg-line md:grid-cols-2">
          <div className="bg-surface p-3">
            <p className="label-caps mb-2 text-dim">Parameters</p>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5">
              {def.parameters.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="num text-right text-xs text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-surface p-3">
            <p className="label-caps mb-2 text-dim">Risk limits · today</p>
            <RiskLimits limits={def.riskLimits} strategyLabel={def.id} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function StrategiesPage() {
  const loading = useDatasetLoading();
  const { instrument, timeframe, strategy: globalStrategy } = useWorkspace();
  const [filter, setFilter] = useState<StrategyFilter>(globalStrategy);
  const [outcome, setOutcome] = useState<"ALL" | "EXECUTED" | "BLOCKED">("ALL");
  const { bars, signals } = getReplayBars(instrument, timeframe);
  const rows = SIGNALS.filter((s) => (filter === "ALL" || s.strategy === filter) && (outcome === "ALL" || s.outcome === outcome));

  return (
    <>
      <PageHeader
        code="STR"
        title="Strategy monitoring"
        description="Configuration, state and risk utilisation of each registered strategy. Signals are generated against the replay session and routed through the simulated risk gate."
        actions={<DemoTag label="DEMO DATASET" />}
      />
      <PageGrid>
        {STRATEGY_LIST.map((def) => (
          <StrategyCard key={def.id} def={def} loading={loading} />
        ))}

        <Panel
          title="Signal map"
          subtitle={`${instrument} · ${timeframe} replay`}
          demo
          loading={loading}
          className="col-span-12"
          actions={
            <Segmented<StrategyFilter>
              label="Signals shown on chart"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: "All" },
                { value: "V1", label: "V1" },
                { value: "V2", label: "V2" },
              ]}
            />
          }
        >
          <div className="h-[360px]">
            <MarketChart bars={bars} signals={signals} strategy={filter} />
          </div>
        </Panel>

        <Panel
          title="Recent signals"
          subtitle={`${rows.length} rows`}
          demo
          loading={loading}
          className="col-span-12"
          actions={
            <Segmented
              label="Filter by outcome"
              value={outcome}
              onChange={setOutcome}
              options={[
                { value: "ALL", label: "All" },
                { value: "EXECUTED", label: "Executed" },
                { value: "BLOCKED", label: "Blocked" },
              ]}
            />
          }
        >
          <SignalsTable rows={rows} />
        </Panel>
      </PageGrid>
    </>
  );
}
