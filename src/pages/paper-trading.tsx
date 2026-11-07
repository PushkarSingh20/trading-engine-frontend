import { useState } from "react";
import { Area, ComposedChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldCheck } from "lucide-react";
import { PageGrid, PageHeader } from "@/components/layout/page-header";
import { EventLog } from "@/components/domain/event-log";
import { Button, Segmented } from "@/components/ui/controls";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Metric, MetricGrid } from "@/components/ui/metric";
import { Panel } from "@/components/ui/panel";
import { Badge, DemoTag, SideTag, StrategyTag } from "@/components/ui/tags";
import { ChartTooltip, axisProps, gridProps, type TipProps } from "@/components/viz/chart-kit";
import { DrawdownChart } from "@/components/viz/equity-charts";
import { EXEC_EVENTS, PAPER_ORDERS, PAPER_PNL_SERIES, PAPER_POSITIONS, PAPER_TRADES, REPLAY_SESSION, paperSummary } from "@/data/paper";
import type { PaperTrade, SimOrder, StrategyFilter } from "@/data/types";
import { useDatasetLoading } from "@/lib/hooks";
import { CHART_COLORS as C, fmtNum, fmtUsd, toneClass } from "@/lib/utils";

const S = paperSummary();

const orderTone = { WORKING: "info", FILLED: "pos", CANCELLED: "muted", REJECTED: "neg" } as const;

export function PaperTradingPage() {
  const loading = useDatasetLoading();
  const [orderView, setOrderView] = useState<"ALL" | "WORKING">("ALL");
  const [histStrategy, setHistStrategy] = useState<StrategyFilter>("ALL");
  const [histResult, setHistResult] = useState<"ALL" | "WIN" | "LOSS">("ALL");

  const orders = orderView === "ALL" ? PAPER_ORDERS : PAPER_ORDERS.filter((o) => o.status === "WORKING");
  const history = PAPER_TRADES.filter(
    (t) => (histStrategy === "ALL" || t.strategy === histStrategy) && (histResult === "ALL" || (histResult === "WIN" ? t.net > 0 : t.net <= 0)),
  ).reverse();

  const orderCols: Column<SimOrder>[] = [
    { key: "t", header: "Time", render: (o) => <span className="num text-muted">{o.time}</span> },
    { key: "id", header: "ID", render: (o) => <span className="num text-dim">{o.id}</span> },
    { key: "s", header: "Strat", render: (o) => <StrategyTag id={o.strategy} /> },
    { key: "a", header: "Action", render: (o) => <span className={`num text-2xs font-medium ${o.action === "BUY" ? "text-pos" : "text-neg"}`}>{o.action}</span> },
    { key: "i", header: "Inst", render: (o) => <span className="num">{o.instrument}</span> },
    { key: "ty", header: "Type", render: (o) => <span className="num text-muted">{o.type}</span> },
    { key: "q", header: "Qty", align: "right", render: (o) => o.qty },
    { key: "p", header: "Price", align: "right", render: (o) => (o.price ? fmtNum(o.price) : <span className="text-dim">MKT</span>) },
    { key: "f", header: "Fill", align: "right", render: (o) => (o.fillPrice ? fmtNum(o.fillPrice) : <span className="text-dim">—</span>) },
    { key: "tag", header: "Tag", render: (o) => <span className="num text-2xs text-muted">{o.tag}</span> },
    { key: "st", header: "Status", align: "right", render: (o) => <Badge tone={orderTone[o.status]}>{o.status}</Badge> },
  ];

  const histCols: Column<PaperTrade>[] = [
    { key: "id", header: "ID", render: (t) => <span className="num text-dim">{t.id}</span> },
    { key: "s", header: "Strat", render: (t) => <StrategyTag id={t.strategy} /> },
    { key: "i", header: "Inst", render: (t) => <span className="num">{t.instrument}</span> },
    { key: "side", header: "Side", render: (t) => <SideTag side={t.side} /> },
    { key: "q", header: "Qty", align: "right", render: (t) => t.qty },
    { key: "in", header: "Entry", align: "right", render: (t) => `${t.entryTime} · ${fmtNum(t.entry)}` },
    { key: "out", header: "Exit", align: "right", render: (t) => `${t.exitTime} · ${fmtNum(t.exit)}` },
    { key: "r", header: "Exit reason", render: (t) => <span className="num text-2xs text-muted">{t.exitReason}</span> },
    { key: "g", header: "Gross", align: "right", render: (t) => <span className={toneClass(t.gross)}>{fmtUsd(t.gross, { signed: true, cents: true })}</span> },
    { key: "fee", header: "Fees", align: "right", render: (t) => <span className="text-muted">{fmtUsd(-t.fees, { cents: true })}</span> },
    { key: "n", header: "Net", align: "right", render: (t) => <span className={toneClass(t.net)}>{fmtUsd(t.net, { signed: true, cents: true })}</span> },
  ];

  return (
    <>
      <PageHeader
        code="PPR"
        title="Paper trading"
        description={`Simulated execution against the ${REPLAY_SESSION.label} replay. Orders are filled by the internal simulator on replay bars — there is no broker connection and no real orders can be placed.`}
        actions={<DemoTag label="SIMULATED" />}
      />

      <div role="note" className="flex items-center gap-2 border-b border-line bg-accent/[0.05] px-4 py-2 md:px-5">
        <ShieldCheck className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-2xs text-muted">
          <span className="font-medium text-fg">Paper mode only.</span> Broker credentials are not supported in this build. Marks reflect the replay cursor at{" "}
          <span className="num text-fg">{REPLAY_SESSION.cursor} ET</span>, not live prices.
        </p>
      </div>

      <PageGrid>
        <div className="col-span-12">
          <MetricGrid label="Session summary" className="grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
            <Metric loading={loading} label="Session net" value={fmtUsd(S.net, { signed: true, cents: true })} tone={toneClass(S.net)} hint="realized + open" />
            <Metric loading={loading} label="Realized" value={fmtUsd(S.realized, { signed: true, cents: true })} tone={toneClass(S.realized)} hint={`${S.trades} closed trades`} />
            <Metric loading={loading} label="Unrealized" value={fmtUsd(S.unrealized, { signed: true, cents: true })} tone={toneClass(S.unrealized)} hint="at replay mark" />
            <Metric loading={loading} label="Intraday max DD" value={fmtUsd(S.maxDd)} tone="text-neg" hint="from session peak" />
            <Metric loading={loading} label="Win / loss" value={`${S.wins} / ${S.trades - S.wins}`} hint="closed trades" />
            <Metric loading={loading} label="Open positions" value={S.open} hint="1 working OCO" />
            <Metric loading={loading} label="Fees" value={fmtUsd(-S.fees, { cents: true })} hint="$4.50 / ct RT" />
          </MetricGrid>
        </div>

        <Panel title="Session P&L" subtitle="5m sampling" demo loading={loading} className="col-span-12 xl:col-span-8">
          <div className="flex h-[320px] flex-col">
            <div className="min-h-0 flex-[3] px-1 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={PAPER_PNL_SERIES} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} syncId="paper">
                  <defs>
                    <linearGradient id="pnlFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={C.accent} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="time" {...axisProps} minTickGap={40} />
                  <YAxis {...axisProps} orientation="right" width={52} />
                  <ReferenceLine y={0} stroke={C.lineStrong} />
                  <ReferenceLine x="12:25" stroke={C.accent} strokeDasharray="3 3" label={{ value: "V2 PAUSED", fill: C.accent, fontSize: 9, fontFamily: "IBM Plex Mono", position: "insideTopLeft" }} />
                  <Tooltip cursor={{ stroke: C.dim, strokeDasharray: "2 3" }} content={(p) => <ChartTooltip {...(p as unknown as TipProps)} format={(v) => fmtUsd(v, { signed: true })} />} />
                  <Area type="monotone" dataKey="pnl" name="Net P&L" stroke={C.accent} strokeWidth={1.4} fill="url(#pnlFill)" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="label-caps border-t border-line px-3 pt-2 text-dim">Drawdown from session peak</p>
            <div className="min-h-0 flex-[1.2] px-1 pb-1">
              <DrawdownChart data={PAPER_PNL_SERIES} xKey="time" format="usd" dataKey="drawdown" />
            </div>
          </div>
        </Panel>

        <Panel title="Open positions" subtitle={`${PAPER_POSITIONS.length} open`} demo loading={loading} className="col-span-12 xl:col-span-4">
          {PAPER_POSITIONS.map((p) => {
            const risk = Math.abs(p.entry - p.stop) * 50 * p.qty;
            const span = p.target - p.stop;
            const markPct = ((p.mark - p.stop) / span) * 100;
            const entryPct = ((p.entry - p.stop) / span) * 100;
            return (
              <article key={`${p.strategy}-${p.instrument}`} className="border-b border-line p-3" aria-label={`${p.strategy} ${p.instrument} ${p.side} position`}>
                <header className="flex items-center gap-2">
                  <StrategyTag id={p.strategy} />
                  <span className="num text-sm font-medium text-fg">{p.instrument}</span>
                  <SideTag side={p.side} />
                  <span className="num text-2xs text-muted">× {p.qty}</span>
                  <span className={`num ml-auto text-sm font-medium ${toneClass(p.unrealized)}`}>{fmtUsd(p.unrealized, { signed: true, cents: true })}</span>
                </header>
                <dl className="num mt-3 grid grid-cols-3 gap-2 text-2xs">
                  <div>
                    <dt className="text-dim">Entry</dt>
                    <dd className="text-fg">{fmtNum(p.entry)}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Mark (replay)</dt>
                    <dd className="text-fg">{fmtNum(p.mark)}</dd>
                  </div>
                  <div>
                    <dt className="text-dim">Opened</dt>
                    <dd className="text-fg">{p.openedAt}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <div className="relative h-1.5 bg-gradient-to-r from-neg/40 via-line to-pos/40" role="img" aria-label={`Price between stop ${fmtNum(p.stop)} and target ${fmtNum(p.target)}`}>
                    <span className="absolute -top-1 h-3.5 w-px bg-muted" style={{ left: `${entryPct}%` }} />
                    <span className="absolute -top-1.5 h-4.5 w-0.5 bg-accent" style={{ left: `${markPct}%` }} />
                  </div>
                  <div className="num mt-1.5 flex justify-between text-[10px]">
                    <span className="text-neg">STP {fmtNum(p.stop)}</span>
                    <span className="text-muted">risk {fmtUsd(risk)}</span>
                    <span className="text-pos">TGT {fmtNum(p.target)}</span>
                  </div>
                </div>
              </article>
            );
          })}
          <div className="p-3">
            <p className="label-caps mb-1 text-dim">V2 · EMA5/9</p>
            <p className="text-xs text-muted">No open positions. Strategy paused after reaching its daily loss limit.</p>
          </div>
        </Panel>

        <Panel
          title="Simulated orders"
          subtitle={`${orders.length} orders`}
          demo
          loading={loading}
          className="col-span-12 xl:col-span-7"
          actions={
            <Segmented
              label="Order filter"
              value={orderView}
              onChange={setOrderView}
              options={[
                { value: "ALL", label: "All" },
                { value: "WORKING", label: "Working" },
              ]}
            />
          }
        >
          <DataTable caption="Simulated orders" columns={orderCols} rows={orders} rowKey={(o) => o.id} maxHeight="22rem" empty={{ title: "No working orders" }} />
        </Panel>

        <Panel title="Execution events" subtitle={`${EXEC_EVENTS.length} events`} demo loading={loading} className="col-span-12 xl:col-span-5">
          <EventLog events={EXEC_EVENTS} />
        </Panel>

        <Panel
          title="Trade history"
          subtitle={`${history.length} of ${PAPER_TRADES.length}`}
          demo
          loading={loading}
          className="col-span-12"
          actions={
            <>
              <Segmented
                label="History strategy filter"
                value={histStrategy}
                onChange={setHistStrategy}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "V1", label: "V1" },
                  { value: "V2", label: "V2" },
                ]}
              />
              <Segmented
                label="History result filter"
                value={histResult}
                onChange={setHistResult}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "WIN", label: "Wins" },
                  { value: "LOSS", label: "Losses" },
                ]}
              />
            </>
          }
        >
          <DataTable
            caption="Paper trade history"
            columns={histCols}
            rows={history}
            rowKey={(t) => t.id}
            empty={{
              title: "No trades match these filters",
              description: "Try a different strategy or result filter. V2 had no winning trades this session.",
              action: (
                <Button
                  onClick={() => {
                    setHistStrategy("ALL");
                    setHistResult("ALL");
                  }}
                >
                  Reset filters
                </Button>
              ),
            }}
          />
        </Panel>
      </PageGrid>
    </>
  );
}
