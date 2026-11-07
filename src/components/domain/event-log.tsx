import type { EventKind, ExecEvent } from "@/data/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/states";

const KIND_STYLE: Record<EventKind, string> = {
  SIGNAL: "text-accent",
  RISK_PASS: "text-pos",
  RISK_BLOCK: "text-neg",
  ORDER_SUBMIT: "text-info",
  FILL: "text-fg",
  CANCEL: "text-dim",
  LIMIT_BREACH: "text-neg",
  STRATEGY_PAUSED: "text-accent",
  SESSION: "text-info",
};

export function EventLog({ events, maxHeight = "22rem" }: { events: ExecEvent[]; maxHeight?: string }) {
  if (!events.length) return <EmptyState title="No events" description="Nothing has been recorded for this selection yet." />;
  return (
    <ol className="num overflow-y-auto py-1 text-2xs" style={{ maxHeight }} aria-label="Execution events, newest first">
      {events.map((e) => (
        <li
          key={e.id}
          className={cn(
            "grid grid-cols-[4.25rem_6.5rem_1.75rem_1fr] items-baseline gap-2 px-3 py-[3px] hover:bg-raised/60",
            (e.kind === "LIMIT_BREACH" || e.kind === "STRATEGY_PAUSED") && "bg-neg/[0.06]",
          )}
        >
          <time className="text-dim">{e.time}</time>
          <span className={cn("truncate font-medium", KIND_STYLE[e.kind])}>{e.kind}</span>
          <span className={e.strategy === "V1" ? "text-accent" : e.strategy === "V2" ? "text-info" : "text-dim"}>{e.strategy ?? "SYS"}</span>
          <span className="truncate text-muted" title={e.message}>
            {e.message}
          </span>
        </li>
      ))}
    </ol>
  );
}
