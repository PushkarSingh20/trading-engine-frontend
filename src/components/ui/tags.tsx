import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { StrategyStatus } from "@/data/types";

export function DemoTag({ className, label = "DEMO" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "num inline-flex h-4 items-center border border-accent/40 px-1 text-[10px] font-medium tracking-wider text-accent",
        className,
      )}
      title="Synthetic sample data — not live market data"
    >
      {label}
    </span>
  );
}

type Tone = "pos" | "neg" | "accent" | "info" | "muted";

const toneMap: Record<Tone, string> = {
  pos: "text-pos border-pos/35 bg-pos/[0.06]",
  neg: "text-neg border-neg/35 bg-neg/[0.06]",
  accent: "text-accent border-accent/35 bg-accent/[0.06]",
  info: "text-info border-info/35 bg-info/[0.06]",
  muted: "text-muted border-line-strong bg-raised",
};

export function Badge({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("num inline-flex h-[18px] items-center whitespace-nowrap border px-1.5 text-[10px] font-medium tracking-wide", toneMap[tone], className)}>
      {children}
    </span>
  );
}

const dotTone: Record<Tone, string> = {
  pos: "bg-pos",
  neg: "bg-neg",
  accent: "bg-accent",
  info: "bg-info",
  muted: "bg-dim",
};

export function StatusDot({ tone = "muted", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-1.5 shrink-0" aria-hidden="true">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-50", dotTone[tone])} />}
      <span className={cn("relative inline-flex size-1.5 rounded-full", dotTone[tone])} />
    </span>
  );
}

export function StrategyStatusBadge({ status }: { status: StrategyStatus }) {
  const tone: Tone = status === "ACTIVE" ? "pos" : status === "PAUSED" ? "accent" : "muted";
  return (
    <Badge tone={tone}>
      <StatusDot tone={tone} />
      <span className="ml-1.5">{status}</span>
    </Badge>
  );
}

export function SideTag({ side }: { side: "LONG" | "SHORT" }) {
  return <span className={cn("num text-2xs font-medium", side === "LONG" ? "text-pos" : "text-neg")}>{side}</span>;
}

export function StrategyTag({ id }: { id: "V1" | "V2" }) {
  return (
    <span className={cn("num inline-flex h-4 items-center px-1 text-[10px] font-semibold", id === "V1" ? "bg-accent/15 text-accent" : "bg-info/15 text-info")}>
      {id}
    </span>
  );
}
