import { DataTable, type Column } from "@/components/ui/data-table";
import { StrategyStatusBadge, StrategyTag } from "@/components/ui/tags";
import { BACKTEST_TRADES, computeMetrics, filterTrades } from "@/data/backtest";
import { STRATEGY_LIST } from "@/data/strategies";
import type { Metrics, StrategyDef } from "@/data/types";
import { cn, fmtNum, fmtPct, fmtUsd, toneClass } from "@/lib/utils";

type Row = { def: StrategyDef; m: Metrics };

const rows: Row[] = STRATEGY_LIST.map((def) => ({ def, m: computeMetrics(filterTrades(BACKTEST_TRADES, def.id)) }));

export function StrategyPerformance({ highlight }: { highlight: "ALL" | "V1" | "V2" }) {
  const columns: Column<Row>[] = [
    {
      key: "s",
      header: "Strategy",
      render: (r) => (
        <span className="flex items-center gap-2">
          <StrategyTag id={r.def.id} />
          <span className="text-fg">{r.def.short}</span>
        </span>
      ),
    },
    { key: "n", header: "Trades", align: "right", render: (r) => r.m.trades },
    { key: "w", header: "Win", align: "right", render: (r) => fmtPct(r.m.winRate, 0) },
    { key: "pf", header: "PF", align: "right", render: (r) => fmtNum(r.m.profitFactor) },
    { key: "e", header: "Exp R", align: "right", render: (r) => <span className={toneClass(r.m.expectancyR)}>{fmtNum(r.m.expectancyR)}</span> },
    { key: "net", header: "Net", align: "right", render: (r) => <span className={toneClass(r.m.netPnl)}>{fmtUsd(r.m.netPnl, { signed: true })}</span> },
    { key: "st", header: "Paper", align: "right", render: (r) => <StrategyStatusBadge status={r.def.status} /> },
  ];
  return (
    <DataTable
      caption="Backtest performance by strategy"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.def.id}
      rowClassName={(r) => cn(highlight !== "ALL" && highlight !== r.def.id && "opacity-40")}
    />
  );
}
