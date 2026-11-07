import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DemoTag } from "./tags";
import { PanelSkeleton } from "./states";

interface PanelProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  demo?: boolean;
  loading?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Panel({ title, subtitle, actions, demo, loading, className, bodyClassName, children }: PanelProps) {
  const headingId = `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={headingId} className={cn("flex min-w-0 flex-col bg-surface", className)}>
      <header className="flex h-9 shrink-0 items-center gap-3 border-b border-line px-3">
        <h2 id={headingId} className="label-caps truncate text-muted">
          {title}
        </h2>
        {subtitle && <span className="num hidden truncate text-2xs text-dim sm:inline">{subtitle}</span>}
        {demo && <DemoTag />}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("relative min-h-0 flex-1", bodyClassName)}>{loading ? <PanelSkeleton /> : children}</div>
    </section>
  );
}
