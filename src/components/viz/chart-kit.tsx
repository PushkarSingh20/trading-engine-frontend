import { CHART_COLORS as C } from "@/lib/utils";

export const axisProps = {
  stroke: C.line,
  tick: { fill: C.dim, fontSize: 10, fontFamily: "IBM Plex Mono" },
  tickLine: false,
  axisLine: { stroke: C.line },
} as const;

export const gridProps = { stroke: C.line, strokeDasharray: "0", vertical: false } as const;

export interface TipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ name?: string | number; value?: unknown; color?: string; dataKey?: unknown }>;
}

export function ChartTooltip({ active, label, payload, format, labelFormat }: TipProps & { format: (v: number) => string; labelFormat?: (l: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-line-strong bg-bg/95 px-2.5 py-1.5 shadow-lg">
      <p className="num mb-1 text-[10px] text-muted">{labelFormat ? labelFormat(String(label)) : label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey ?? p.name)} className="num flex items-center justify-between gap-4 text-2xs">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="inline-block size-1.5" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-fg">{format(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

export const monthLabel = (d: string) => {
  const [y, m] = d.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y.slice(2)}`;
};
