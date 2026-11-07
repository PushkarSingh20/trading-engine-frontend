import type { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-shimmer bg-raised", className)} />;
}

export function PanelSkeleton() {
  return (
    <div className="flex h-full min-h-32 flex-col gap-2 p-3" role="status" aria-live="polite">
      <span className="sr-only">Loading dataset…</span>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="min-h-16 w-full flex-1" />
    </div>
  );
}

export function EmptyState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 py-8 text-center", className)}>
      <Inbox className="size-5 text-dim" aria-hidden="true" />
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, description, action, className }: { title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex h-full min-h-40 flex-col items-center justify-center gap-2 px-6 py-8 text-center", className)}>
      <AlertTriangle className="size-5 text-neg" aria-hidden="true" />
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-2 flex gap-2">{action}</div>}
    </div>
  );
}
