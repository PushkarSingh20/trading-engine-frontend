import { Meter } from "@/components/ui/controls";
import type { RiskLimit } from "@/data/types";
import { cn, fmtPct, fmtUsd } from "@/lib/utils";

function fmtLimit(v: number, unit: RiskLimit["unit"]) {
  if (unit === "usd") return fmtUsd(v);
  if (unit === "pct") return fmtPct(v, 1);
  if (unit === "contracts") return `${v} ct`;
  return String(v);
}

export function RiskLimits({ limits, strategyLabel }: { limits: RiskLimit[]; strategyLabel: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {limits.map((l) => {
        const util = l.limit ? l.used / l.limit : 0;
        const tone = util >= 1 ? "neg" : util >= 0.75 ? "accent" : "pos";
        return (
          <li key={l.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted">{l.label}</span>
              <span className="num text-2xs">
                <span className={cn(util >= 1 ? "text-neg" : "text-fg")}>{fmtLimit(l.used, l.unit)}</span>
                <span className="text-dim"> / {fmtLimit(l.limit, l.unit)}</span>
                <span className={cn("ml-2", util >= 1 ? "text-neg" : util >= 0.75 ? "text-accent" : "text-dim")}>{Math.round(util * 100)}%</span>
              </span>
            </div>
            <Meter value={Math.min(l.used, l.limit)} max={l.limit} tone={tone} label={`${strategyLabel} ${l.label} utilisation`} />
          </li>
        );
      })}
    </ul>
  );
}
