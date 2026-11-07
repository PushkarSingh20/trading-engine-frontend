import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge, SideTag, StrategyTag } from "@/components/ui/tags";
import type { SignalRecord } from "@/data/types";
import { fmtNum } from "@/lib/utils";

export function SignalsTable({ rows, compact = false, maxHeight }: { rows: SignalRecord[]; compact?: boolean; maxHeight?: string }) {
  const columns: Column<SignalRecord>[] = [
    { key: "time", header: "Time", render: (r) => <span className="num text-muted">{r.time}</span> },
    { key: "strategy", header: "Strat", render: (r) => <StrategyTag id={r.strategy} /> },
    { key: "inst", header: "Inst", render: (r) => <span className="num">{r.instrument}</span> },
    { key: "side", header: "Side", render: (r) => <SideTag side={r.side} /> },
    ...(compact ? [] : [{ key: "trigger", header: "Trigger", render: (r: SignalRecord) => <span className="text-muted">{r.trigger}</span> }]),
    { key: "price", header: "Price", align: "right", render: (r) => fmtNum(r.price) },
    {
      key: "outcome",
      header: "Outcome",
      align: "right",
      render: (r) => <Badge tone={r.outcome === "EXECUTED" ? "pos" : "accent"}>{r.outcome}</Badge>,
    },
    ...(compact ? [] : [{ key: "note", header: "Note", render: (r: SignalRecord) => <span className="text-muted">{r.note}</span> }]),
  ];
  return (
    <DataTable
      caption="Recent strategy signals"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      maxHeight={maxHeight}
      empty={{ title: "No signals for this selection", description: "No signals were generated for the selected strategy in this replay session." }}
    />
  );
}
