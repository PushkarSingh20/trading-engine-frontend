import { useMemo, useState } from "react";
import type { Bar, ChartSignal, StrategyFilter } from "@/data/types";
import { useElementSize } from "@/lib/hooks";
import { CHART_COLORS as C, cn, fmtNum } from "@/lib/utils";

interface MarketChartProps {
  bars: Bar[];
  signals: ChartSignal[];
  strategy?: StrategyFilter;
  className?: string;
}

const PAD = { top: 28, right: 64, bottom: 22, left: 8 };

export function MarketChart({ bars, signals, strategy = "ALL", className }: MarketChartProps) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const [cursor, setCursor] = useState<number | null>(null);

  const visibleSignals = strategy === "ALL" ? signals : signals.filter((s) => s.strategy === strategy);

  const geo = useMemo(() => {
    const plotW = Math.max(0, width - PAD.left - PAD.right);
    const plotH = Math.max(0, height - PAD.top - PAD.bottom);
    const priceH = plotH * 0.78;
    const volTop = PAD.top + plotH * 0.82;
    const volH = plotH * 0.18;
    const lo = Math.min(...bars.map((b) => b.low));
    const hi = Math.max(...bars.map((b) => b.high));
    const span = hi - lo || 1;
    const min = lo - span * 0.06;
    const max = hi + span * 0.06;
    const maxVol = Math.max(...bars.map((b) => b.volume));
    const step = plotW / bars.length;
    const x = (i: number) => PAD.left + step * i + step / 2;
    const y = (p: number) => PAD.top + ((max - p) / (max - min)) * priceH;
    const ticks = Array.from({ length: 5 }, (_, k) => min + ((max - min) * (k + 0.5)) / 5);
    return { plotW, plotH, priceH, volTop, volH, maxVol, step, x, y, ticks };
  }, [bars, width, height]);

  const active = cursor !== null ? bars[cursor] : bars[bars.length - 1];
  const change = active.close - active.open;
  const linePath = (key: "ema5" | "ema9") => bars.map((b, i) => `${i ? "L" : "M"}${geo.x(i).toFixed(1)},${geo.y(b[key]).toFixed(1)}`).join("");
  const bodyW = Math.max(1, geo.step * 0.62);

  return (
    <div ref={ref} className={cn("relative h-full w-full select-none", className)}>
      <div className="pointer-events-none absolute left-3 top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-2xs" aria-live="polite">
        <span className="num text-muted">{active.label}</span>
        {(["open", "high", "low", "close"] as const).map((k) => (
          <span key={k} className="num text-dim">
            {k[0].toUpperCase()} <span className={change >= 0 ? "text-pos" : "text-neg"}>{fmtNum(active[k])}</span>
          </span>
        ))}
        <span className="num text-dim">
          VOL <span className="text-fg">{active.volume.toLocaleString()}</span>
        </span>
        <span className="num text-dim">
          VROC <span className="text-fg">{active.vroc.toFixed(0)}%</span>
        </span>
        <span className="num flex items-center gap-1 text-dim">
          <span className="inline-block h-px w-3 bg-accent" /> EMA5
        </span>
        <span className="num flex items-center gap-1 text-dim">
          <span className="inline-block h-px w-3 bg-info" /> EMA9
        </span>
      </div>

      {width > 0 && height > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Candlestick chart of ${bars.length} replay bars with EMA5 and EMA9 overlays and ${visibleSignals.length} strategy signals. Demo data.`}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const i = Math.floor((e.clientX - rect.left - PAD.left) / geo.step);
            setCursor(i >= 0 && i < bars.length ? i : null);
          }}
          onPointerLeave={() => setCursor(null)}
        >
          {geo.ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(t)} y2={geo.y(t)} stroke={C.line} />
              <text x={width - PAD.right + 8} y={geo.y(t)} dy="0.32em" fill={C.dim} fontSize={10} fontFamily="IBM Plex Mono">
                {fmtNum(t)}
              </text>
            </g>
          ))}
          <line x1={PAD.left} x2={width - PAD.right} y1={geo.volTop - 4} y2={geo.volTop - 4} stroke={C.line} />

          {bars.map((b, i) => {
            if (i % Math.max(1, Math.round(bars.length / 7)) !== 0) return null;
            return (
              <text key={b.i} x={geo.x(i)} y={height - 6} textAnchor="middle" fill={C.dim} fontSize={10} fontFamily="IBM Plex Mono">
                {b.label}
              </text>
            );
          })}

          {bars.map((b, i) => {
            const up = b.close >= b.open;
            const col = up ? C.pos : C.neg;
            const top = geo.y(Math.max(b.open, b.close));
            const bh = Math.max(1, Math.abs(geo.y(b.open) - geo.y(b.close)));
            const vh = (b.volume / geo.maxVol) * geo.volH;
            return (
              <g key={b.i} opacity={cursor === null || cursor === i ? 1 : 0.55}>
                <line x1={geo.x(i)} x2={geo.x(i)} y1={geo.y(b.high)} y2={geo.y(b.low)} stroke={col} />
                <rect x={geo.x(i) - bodyW / 2} y={top} width={bodyW} height={bh} fill={up ? C.bg : col} stroke={col} />
                <rect x={geo.x(i) - bodyW / 2} y={geo.volTop + geo.volH - vh} width={bodyW} height={vh} fill={b.vroc > 60 ? C.accent : C.lineStrong} opacity={0.8} />
              </g>
            );
          })}

          <path d={linePath("ema9")} fill="none" stroke={C.info} strokeWidth={1.25} />
          <path d={linePath("ema5")} fill="none" stroke={C.accent} strokeWidth={1.25} />

          {visibleSignals.map((s) => {
            const b = bars[s.i];
            const long = s.side === "LONG";
            const px = geo.x(s.i);
            const py = long ? geo.y(b.low) + 10 : geo.y(b.high) - 10;
            const pts = long ? `${px},${py - 5} ${px - 5},${py + 4} ${px + 5},${py + 4}` : `${px},${py + 5} ${px - 5},${py - 4} ${px + 5},${py - 4}`;
            return (
              <g key={`${s.strategy}-${s.i}`}>
                <polygon points={pts} fill={long ? C.pos : C.neg} />
                <text x={px} y={long ? py + 15 : py - 9} textAnchor="middle" fontSize={9} fontFamily="IBM Plex Mono" fill={s.strategy === "V1" ? C.accent : C.info}>
                  {s.strategy}
                </text>
              </g>
            );
          })}

          {cursor !== null && (
            <g pointerEvents="none">
              <line x1={geo.x(cursor)} x2={geo.x(cursor)} y1={PAD.top} y2={geo.volTop + geo.volH} stroke={C.dim} strokeDasharray="2 3" />
              <rect x={width - PAD.right + 2} y={geo.y(bars[cursor].close) - 8} width={PAD.right - 4} height={16} fill={C.raised} stroke={C.lineStrong} />
              <text x={width - PAD.right + 8} y={geo.y(bars[cursor].close)} dy="0.32em" fill={C.fg} fontSize={10} fontFamily="IBM Plex Mono">
                {fmtNum(bars[cursor].close)}
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
