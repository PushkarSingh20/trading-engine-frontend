import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Segmented<T extends string>({ label, value, options, onChange, size = "sm", className }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex border border-line-strong bg-bg", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "num whitespace-nowrap border-r border-line-strong px-2 text-2xs font-medium transition-colors last:border-r-0",
              size === "sm" ? "h-6" : "h-7",
              active ? "bg-raised text-fg shadow-[inset_0_-1px_0_var(--color-accent)]" : "text-muted hover:text-fg",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Button({ className, variant = "default", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "accent" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "default" && "border-line-strong bg-raised text-fg hover:border-dim",
        variant === "ghost" && "border-transparent text-muted hover:text-fg",
        variant === "accent" && "border-accent/50 bg-accent/10 text-accent hover:bg-accent/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative inline-flex items-center">
      <select
        className={cn(
          "num h-6 appearance-none border border-line-strong bg-bg pl-2 pr-6 text-2xs font-medium text-fg hover:border-dim",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted" aria-hidden="true" />
    </span>
  );
}

export function Meter({ value, max, tone = "accent", label }: { value: number; max: number; tone?: "accent" | "pos" | "neg" | "info"; label: string }) {
  const pct = Math.min(1, max ? value / max : 0);
  const color = { accent: "bg-accent", pos: "bg-pos", neg: "bg-neg", info: "bg-info" }[tone];
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative h-1 w-full bg-line"
    >
      <div className={cn("absolute inset-y-0 left-0", color)} style={{ width: `${pct * 100}%` }} />
      {[0.25, 0.5, 0.75].map((t) => (
        <span key={t} className="absolute inset-y-0 w-px bg-bg" style={{ left: `${t * 100}%` }} />
      ))}
    </div>
  );
}
