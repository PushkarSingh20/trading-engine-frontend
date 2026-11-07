import type { ReactNode } from "react";

export function PageHeader({ code, title, description, actions }: { code: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-4 pb-3 pt-4 md:px-5">
      <div className="min-w-0">
        <p className="num text-[10px] tracking-widest text-dim">
          {code} <span className="text-line-strong">/</span> TRADING ENGINE
        </p>
        <h1 className="mt-1 text-xl font-medium tracking-tight text-fg text-balance">{title}</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted text-pretty">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-12 gap-px border-b border-line bg-line">{children}</div>;
}
