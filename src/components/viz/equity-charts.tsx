import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EquityPoint } from "@/data/types";
import { CHART_COLORS as C, fmtPct, fmtUsd } from "@/lib/utils";
import { ChartTooltip, axisProps, gridProps, monthLabel, type TipProps } from "./chart-kit";

const usdK = (v: number) => `${(v / 1000).toFixed(0)}k`;

export function EquityCurve({ data, mode = "combined", height = "100%" }: { data: EquityPoint[]; mode?: "combined" | "split"; height?: number | `${number}%` }) {
  if (mode === "split") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} syncId="bt">
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" {...axisProps} tickFormatter={monthLabel} minTickGap={48} />
          <YAxis {...axisProps} orientation="right" width={52} tickFormatter={usdK} />
          <ReferenceLine y={0} stroke={C.lineStrong} />
          <Tooltip cursor={{ stroke: C.dim, strokeDasharray: "2 3" }} content={(p) => <ChartTooltip {...(p as unknown as TipProps)} format={(v) => fmtUsd(v, { signed: true })} />} />
          <Line type="monotone" dataKey="v1" name="V1 VROC" stroke={C.accent} dot={false} strokeWidth={1.4} isAnimationActive={false} />
          <Line type="monotone" dataKey="v2" name="V2 EMA" stroke={C.info} dot={false} strokeWidth={1.4} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 0 }} syncId="bt">
        <defs>
          <linearGradient id="eqFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
            <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="date" {...axisProps} tickFormatter={monthLabel} minTickGap={48} />
        <YAxis {...axisProps} orientation="right" width={52} domain={["dataMin - 2000", "dataMax + 2000"]} tickFormatter={usdK} />
        <Tooltip cursor={{ stroke: C.dim, strokeDasharray: "2 3" }} content={(p) => <ChartTooltip {...(p as unknown as TipProps)} format={(v) => fmtUsd(v)} />} />
        <Area type="monotone" dataKey="equity" name="Equity" stroke={C.accent} strokeWidth={1.4} fill="url(#eqFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DrawdownChart({ data, height = "100%", dataKey = "drawdown", xKey = "date", format = "pct" }: { data: object[]; height?: number | `${number}%`; dataKey?: string; xKey?: string; format?: "pct" | "usd" }) {
  const fmt = format === "pct" ? (v: number) => fmtPct(v, 1) : (v: number) => fmtUsd(v);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }} syncId={xKey === "date" ? "bt" : "paper"}>
        <defs>
          <linearGradient id={`ddFill-${dataKey}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.neg} stopOpacity={0.05} />
            <stop offset="100%" stopColor={C.neg} stopOpacity={0.3} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={xKey === "date" ? monthLabel : undefined} minTickGap={48} />
        <YAxis {...axisProps} orientation="right" width={52} tickFormatter={format === "pct" ? (v: number) => `${(v * 100).toFixed(0)}%` : (v: number) => `${v}`} />
        <Tooltip cursor={{ stroke: C.dim, strokeDasharray: "2 3" }} content={(p) => <ChartTooltip {...(p as unknown as TipProps)} format={fmt} />} />
        <Area type="stepAfter" dataKey={dataKey} name="Drawdown" stroke={C.neg} strokeWidth={1} fill={`url(#ddFill-${dataKey})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
