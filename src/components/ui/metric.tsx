import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./states";

interface MetricProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: string;
  loading?: boolean;
  className?: string;
}

export function Metric({ label, value, hint, tone, loading, className }: MetricProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 bg-surface px-3 py-2.5", className)}>
      <dt className="label-caps truncate text-dim">{label}</dt>
      {loading ? (
        <dd>
          <Skeleton className="mt-1 h-5 w-20" />
        </dd>
      ) : (
        <>
          <dd className={cn("num truncate text-lg leading-6 font-medium text-fg", tone)}>{value}</dd>
          {hint && <dd className="num truncate text-2xs text-muted">{hint}</dd>}
        </>
      )}
    </div>
  );
}

export function MetricGrid({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <dl aria-label={label} className={cn("grid gap-px bg-line", className)}>
      {children}
    </dl>
  );
}
