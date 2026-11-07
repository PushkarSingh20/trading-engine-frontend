import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PageGrid, PageHeader } from "@/components/layout/page-header";
import { EventLog } from "@/components/domain/event-log";
import { RiskLimits } from "@/components/domain/risk-limits";
import { SignalsTable } from "@/components/domain/signals-table";
import { StrategyPerformance } from "@/components/domain/strategy-performance";
import { SystemMapPanel } from "@/components/domain/system-map-panel";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Panel } from "@/components/ui/panel";
import { DemoTag, StrategyStatusBadge } from "@/components/ui/tags";
import { DrawdownChart, EquityCurve } from "@/components/viz/equity-charts";
import { BACKTEST_CONFIG, BACKTEST_TRADES, buildEquity, computeMetrics, filterTrades } from "@/data/backtest";
import { EXEC_EVENTS, SIGNALS } from "@/data/paper";
import { STRATEGY_LIST } from "@/data/strategies";
import { useDatasetLoading } from "@/lib/hooks";
import { fmtNum, fmtPct, fmtUsd, toneClass } from "@/lib/utils";
import { useWorkspace } from "@/state/workspace";

export function OverviewPage() {
  const loading = useDatasetLoading();
  const { strategy } = useWorkspace();
  const trades = useMemo(() => filterTrades(BACKTEST_TRADES, strategy), [strategy]);
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const equity = useMemo(() => buildEquity(trades), [trades]);
  const scope = strategy === "ALL" ? "V1 + V2" : strategy;
  const signals = strategy === "ALL" ? SIGNALS : SIGNALS.filter((s) => s.strategy === strategy);
  const events = strategy === "ALL" ? EXEC_EVENTS : EXEC_EVENTS.filter((e) => !e.strategy || e.strategy === strategy);
  const strategies = strategy === "ALL" ? STRATEGY_LIST : STRATEGY_LIST.filter((s) => s.id === strategy);

  return (
    <>
      <PageHeader
        code="OVR"
        title="Overview"
        description={`Research summary for ${scope} on backtest ${BACKTEST_CONFIG.id} (${BACKTEST_CONFIG.window[0]} → ${BACKTEST_CONFIG.window[1]}) and the current paper replay session. All figures derive from the bundled DEMO dataset.`}
        actions={<DemoTag label="DEMO DATASET" />}
      />
      <PageGrid>
        <SystemMapPanel loading={loading} className="col-span-12 xl:col-span-8 xl:min-h-[540px]" />

        <div className="col-span-12 flex flex-col gap-px bg-line xl:col-span-4">
          <Panel title="Backtest analytics" subtitle={scope} demo>
            <MetricGrid label="Backtest analytics" className="grid-cols-2 sm:grid-cols-4 xl:grid-cols-2">
              <Metric loading={loading} label="Net P&L" value={fmtUsd(m.netPnl, { signed: true })} tone={toneClass(m.netPnl)} hint={fmtPct(m.netPnl / BACKTEST_CONFIG.startingEquity, 1, true)} />
              <Metric loading={loading} label="Profit factor" value={fmtNum(m.profitFactor)} hint={`${fmtUsd(m.grossProfit)} / ${fmtUsd(m.grossLoss)}`} />
              <Metric loading={loading} label="Win rate" value={fmtPct(m.winRate, 1)} hint={`${Math.round(m.winRate * m.trades)} of ${m.trades}`} />
              <Metric loading={loading} label="Expectancy" value={`${fmtNum(m.expectancyR)}R`} hint={`${fmtUsd(m.expectancy, { signed: true, cents: true })} / trade`} tone={toneClass(m.expectancyR)} />
              <Metric loading={loading} label="Trades" value={m.trades} hint={`avg ${fmtNum(m.avgBars, 1)} bars held`} />
              <Metric loading={loading} label="Risk / reward" value={`1 : ${fmtNum(m.riskReward)}`} hint={`avg W ${fmtUsd(m.avgWin)} · L ${fmtUsd(m.avgLoss)}`} />
              <Metric loading={loading} label="Max drawdown" value={fmtPct(-m.maxDrawdownPct, 2)} tone="text-neg" hint={fmtUsd(-m.maxDrawdown)} />
              <Metric loading={loading} label="Recovery factor" value={fmtNum(m.recoveryFactor)} hint="net P&L / max DD" />
            </MetricGrid>
          </Panel>
          <Panel title="Strategy performance" loading={loading} className="flex-1">
            <StrategyPerformance highlight={strategy} />
          </Panel>
        </div>

        <Panel
          title="Equity curve"
          subtitle={`start ${fmtUsd(BACKTEST_CONFIG.startingEquity)} · risk ${fmtUsd(BACKTEST_CONFIG.riskPerTrade)}/trade`}
          demo
          loading={loading}
          className="col-span-12 xl:col-span-8"
          actions={
            <Link to="/backtesting" className="flex items-center gap-1 text-2xs text-muted hover:text-fg">
              Full analysis <ArrowUpRight className="size-3" aria-hidden="true" />
            </Link>
          }
        >
          <div className="flex h-[340px] flex-col">
            <div className="min-h-0 flex-[3] px-1 pt-1">
              <EquityCurve data={equity} />
            </div>
            <p className="label-caps border-t border-line px-3 pt-2 text-dim">Drawdown</p>
            <div className="min-h-0 flex-[1.2] px-1 pb-1">
              <DrawdownChart data={equity} />
            </div>
          </div>
        </Panel>

        <Panel title="Recent signals" subtitle="paper replay" demo loading={loading} className="col-span-12 xl:col-span-4">
          <SignalsTable rows={signals.slice(0, 9)} compact maxHeight="340px" />
        </Panel>

        <Panel title="Configured risk limits" subtitle="today · paper" loading={loading} className="col-span-12 lg:col-span-6">
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {strategies.map((s) => (
              <div key={s.id} className="bg-surface p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-fg">{s.name}</p>
                  <StrategyStatusBadge status={s.status} />
                </div>
                <RiskLimits limits={s.riskLimits} strategyLabel={s.id} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Execution events" subtitle="simulated" demo loading={loading} className="col-span-12 lg:col-span-6">
          <EventLog events={events} maxHeight="17rem" />
        </Panel>
      </PageGrid>
    </>
  );
}
