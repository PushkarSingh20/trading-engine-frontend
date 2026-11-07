import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageGrid, PageHeader } from "@/components/layout/page-header";
import { Button, Segmented } from "@/components/ui/controls";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Panel } from "@/components/ui/panel";
import { DemoTag, SideTag, StrategyTag } from "@/components/ui/tags";
import { ChartTooltip, axisProps, gridProps, type TipProps } from "@/components/viz/chart-kit";
import { DrawdownChart, EquityCurve } from "@/components/viz/equity-charts";
import { BACKTEST_CONFIG, BACKTEST_TRADES, buildEquity, computeMetrics, filterTrades, monthlyReturns, rDistribution } from "@/data/backtest";
import type { BacktestTrade } from "@/data/types";
import { useDatasetLoading } from "@/lib/hooks";
import { CHART_COLORS as C, cn, fmtNum, fmtPct, fmtUsd, toneClass } from "@/lib/utils";
import { useWorkspace } from "@/state/workspace";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PAGE = 15;

function heatColor(ret: number) {
  const a = Math.min(1, Math.abs(ret) / 0.04);
  return ret >= 0 ? `rgba(55,197,139,${0.08 + a * 0.5})` : `rgba(236,91,91,${0.08 + a * 0.5})`;
}

export function BacktestingPage() {
  const loading = useDatasetLoading();
  const { strategy } = useWorkspace();
  const [equityMode, setEquityMode] = useState<"combined" | "split">("combined");
  const [side, setSide] = useState<"ALL" | "LONG" | "SHORT">("ALL");
  const [page, setPage] = useState(0);

  const trades = useMemo(() => filterTrades(BACKTEST_TRADES, strategy), [strategy]);
  const m = useMemo(() => computeMetrics(trades), [trades]);
  const equity = useMemo(() => buildEquity(trades), [trades]);
  const months = useMemo(() => monthlyReturns(trades), [trades]);
  const dist = useMemo(() => rDistribution(trades), [trades]);
  const longs = computeMetrics(trades.filter((t) => t.side === "LONG"));
  const shorts = computeMetrics(trades.filter((t) => t.side === "SHORT"));
  const years = [...new Set(months.map((x) => x.year))];

  const listed = useMemo(() => [...trades].reverse().filter((t) => side === "ALL" || t.side === side), [trades, side]);
  const pages = Math.max(1, Math.ceil(listed.length / PAGE));
  const current = Math.min(page, pages - 1);

  const columns: Column<BacktestTrade>[] = [
    { key: "id", header: "#", render: (t) => <span className="num text-dim">{String(t.id).padStart(4, "0")}</span> },
    { key: "d", header: "Date", render: (t) => <span className="num text-muted">{t.date}</span> },
    { key: "s", header: "Strat", render: (t) => <StrategyTag id={t.strategy} /> },
    { key: "i", header: "Inst", render: (t) => <span className="num">{t.instrument}</span> },
    { key: "side", header: "Side", render: (t) => <SideTag side={t.side} /> },
    { key: "q", header: "Qty", align: "right", render: (t) => t.qty },
    { key: "in", header: "Entry", align: "right", render: (t) => `${t.entryTime} · ${fmtNum(t.entry)}` },
    { key: "out", header: "Exit", align: "right", render: (t) => `${t.exitTime} · ${fmtNum(t.exit)}` },
    { key: "b", header: "Bars", align: "right", render: (t) => t.bars },
    { key: "r", header: "R", align: "right", render: (t) => <span className={toneClass(t.r)}>{fmtNum(t.r)}</span> },
    { key: "p", header: "Net P&L", align: "right", render: (t) => <span className={toneClass(t.pnl)}>{fmtUsd(t.pnl, { signed: true, cents: true })}</span> },
  ];

  const config: [string, string][] = [
    ["Run", BACKTEST_CONFIG.id],
    ["Window", `${BACKTEST_CONFIG.window[0]} → ${BACKTEST_CONFIG.window[1]}`],
    ["Universe", `${BACKTEST_CONFIG.instruments.join(", ")} · ${BACKTEST_CONFIG.timeframe}`],
    ["Capital", fmtUsd(BACKTEST_CONFIG.startingEquity)],
    ["Risk / trade", fmtUsd(BACKTEST_CONFIG.riskPerTrade)],
    ["Costs", `$${BACKTEST_CONFIG.commission}/ct RT · ${BACKTEST_CONFIG.slippage}`],
    ["Fills", BACKTEST_CONFIG.fillModel],
    ["Data", BACKTEST_CONFIG.dataset],
  ];

  return (
    <>
      <PageHeader
        code="BT"
        title="Backtesting analytics"
        description="In-sample results for the selected strategy scope. Use the top bar strategy selector to isolate V1 or V2. Results are computed from a synthetic DEMO trade set and carry no predictive value."
        actions={<DemoTag label="DEMO RESULTS" />}
      />
      <PageGrid>
        <section aria-label="Run configuration" className="col-span-12 bg-surface">
          <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4 2xl:grid-cols-8">
            {config.map(([k, v]) => (
              <div key={k} className="bg-surface px-3 py-2">
                <dt className="label-caps text-dim">{k}</dt>
                <dd className="num mt-0.5 truncate text-2xs text-fg" title={v}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="col-span-12">
          <MetricGrid label="Backtest summary metrics" className="grid-cols-2 sm:grid-cols-4 xl:grid-cols-8">
            <Metric loading={loading} label="Net P&L" value={fmtUsd(m.netPnl, { signed: true })} tone={toneClass(m.netPnl)} hint={fmtPct(m.netPnl / BACKTEST_CONFIG.startingEquity, 1, true)} />
            <Metric loading={loading} label="Profit factor" value={fmtNum(m.profitFactor)} hint="gross W / gross L" />
            <Metric loading={loading} label="Win rate" value={fmtPct(m.winRate, 1)} hint={`${m.trades} trades`} />
            <Metric loading={loading} label="Expectancy" value={`${fmtNum(m.expectancyR)}R`} tone={toneClass(m.expectancyR)} hint={fmtUsd(m.expectancy, { signed: true, cents: true })} />
            <Metric loading={loading} label="Risk / reward" value={`1 : ${fmtNum(m.riskReward)}`} hint="avg win / avg loss" />
            <Metric loading={loading} label="Max drawdown" value={fmtPct(-m.maxDrawdownPct, 2)} tone="text-neg" hint={fmtUsd(-m.maxDrawdown)} />
            <Metric loading={loading} label="Largest win" value={fmtUsd(m.largestWin)} tone="text-pos" hint="single trade" />
            <Metric loading={loading} label="Largest loss" value={fmtUsd(m.largestLoss)} tone="text-neg" hint="single trade" />
          </MetricGrid>
        </div>

        <Panel
          title="Equity curve"
          demo
          loading={loading}
          className="col-span-12 xl:col-span-8"
          actions={
            <Segmented
              label="Equity curve mode"
              value={equityMode}
              onChange={setEquityMode}
              options={[
                { value: "combined", label: "Account" },
                { value: "split", label: "By strategy" },
              ]}
            />
          }
        >
          <div className="h-[300px] px-1 pt-1">
            <EquityCurve data={equity} mode={equityMode} />
          </div>
        </Panel>

        <Panel title="R-multiple distribution" subtitle={`${m.trades} trades`} demo loading={loading} className="col-span-12 xl:col-span-4">
          <div className="h-[300px] px-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...axisProps} interval={1} />
                <YAxis {...axisProps} orientation="right" width={32} allowDecimals={false} />
                <ReferenceLine x="+0R" stroke={C.lineStrong} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} content={(p) => <ChartTooltip {...(p as unknown as TipProps)} format={(v) => `${v} trades`} labelFormat={(l) => `bin ≥ ${l}`} />} />
                <Bar dataKey="count" name="Trades" isAnimationActive={false}>
                  {dist.map((d) => (
                    <Cell key={d.label} fill={d.lo >= 0 ? C.pos : C.neg} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Underwater curve" subtitle="peak-to-trough" demo loading={loading} className="col-span-12 xl:col-span-8">
          <div className="h-[180px] px-1 pt-1">
            <DrawdownChart data={equity} />
          </div>
        </Panel>

        <Panel title="Long vs short" loading={loading} className="col-span-12 xl:col-span-4">
          <table className="w-full text-xs">
            <caption className="sr-only">Long versus short performance</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="label-caps h-7 px-3 text-left text-dim">
                  Metric
                </th>
                <th scope="col" className="label-caps px-3 text-right text-pos">
                  Long
                </th>
                <th scope="col" className="label-caps px-3 text-right text-neg">
                  Short
                </th>
              </tr>
            </thead>
            <tbody className="num">
              {(
                [
                  ["Trades", String(longs.trades), String(shorts.trades)],
                  ["Win rate", fmtPct(longs.winRate, 1), fmtPct(shorts.winRate, 1)],
                  ["Profit factor", fmtNum(longs.profitFactor), fmtNum(shorts.profitFactor)],
                  ["Expectancy", `${fmtNum(longs.expectancyR)}R`, `${fmtNum(shorts.expectancyR)}R`],
                  ["Net P&L", fmtUsd(longs.netPnl, { signed: true }), fmtUsd(shorts.netPnl, { signed: true })],
                ] as const
              ).map(([k, a, b]) => (
                <tr key={k} className="border-b border-line/70">
                  <th scope="row" className="h-8 px-3 text-left font-sans font-normal text-muted">
                    {k}
                  </th>
                  <td className="px-3 text-right text-fg">{a}</td>
                  <td className="px-3 text-right text-fg">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Monthly returns" subtitle="% of equity at month start" demo loading={loading} className="col-span-12">
          <div className="overflow-x-auto p-3">
            <table className="w-full min-w-[720px] border-separate border-spacing-px text-2xs">
              <caption className="sr-only">Monthly returns heatmap</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-12" />
                  {MONTHS.map((mo) => (
                    <th key={mo} scope="col" className="label-caps pb-1 text-center font-medium text-dim">
                      {mo}
                    </th>
                  ))}
                  <th scope="col" className="label-caps pb-1 text-right font-medium text-dim">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="num">
                {years.map((y) => {
                  const row = months.filter((x) => x.year === y);
                  const total = row.reduce((s, x) => (1 + s) * (1 + x.ret) - 1, 0);
                  return (
                    <tr key={y}>
                      <th scope="row" className="pr-2 text-left font-normal text-muted">
                        {y}
                      </th>
                      {MONTHS.map((_, i) => {
                        const cell = row.find((x) => x.month === i + 1);
                        return (
                          <td
                            key={i}
                            className="h-8 text-center text-fg"
                            style={{ background: cell ? heatColor(cell.ret) : "var(--color-raised)" }}
                            title={cell ? `${fmtUsd(cell.pnl, { signed: true })}` : "No data"}
                          >
                            {cell ? fmtPct(cell.ret, 1, true) : <span className="text-dim">—</span>}
                          </td>
                        );
                      })}
                      <td className={cn("pl-2 text-right font-medium", toneClass(total))}>{fmtPct(total, 1, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Trade list"
          subtitle={`${listed.length} trades · newest first`}
          demo
          loading={loading}
          className="col-span-12"
          actions={
            <Segmented
              label="Filter by side"
              value={side}
              onChange={(v) => {
                setSide(v);
                setPage(0);
              }}
              options={[
                { value: "ALL", label: "All" },
                { value: "LONG", label: "Long" },
                { value: "SHORT", label: "Short" },
              ]}
            />
          }
        >
          <DataTable caption="Backtest trades" columns={columns} rows={listed.slice(current * PAGE, current * PAGE + PAGE)} rowKey={(t) => t.id} empty={{ title: "No trades match this filter" }} />
          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <span className="num text-2xs text-dim">
              page {current + 1} / {pages}
            </span>
            <div className="flex gap-1">
              <Button onClick={() => setPage(Math.max(0, current - 1))} disabled={current === 0}>
                Prev
              </Button>
              <Button onClick={() => setPage(Math.min(pages - 1, current + 1))} disabled={current >= pages - 1}>
                Next
              </Button>
            </div>
          </div>
        </Panel>
      </PageGrid>
    </>
  );
}
