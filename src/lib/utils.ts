import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtUsd(value: number, opts: { signed?: boolean; cents?: boolean } = {}) {
  const f = opts.cents ? usd2 : usd0;
  const sign = value < 0 ? "-" : opts.signed && value > 0 ? "+" : "";
  return `${sign}${f.format(Math.abs(value))}`;
}

export function fmtPct(value: number, digits = 1, signed = false) {
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

export function fmtNum(value: number, digits = 2) {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtSignedNum(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${fmtNum(value, digits)}`;
}

export function toneClass(value: number) {
  if (value > 0) return "text-pos";
  if (value < 0) return "text-neg";
  return "text-muted";
}

export const CHART_COLORS = {
  line: "#1b1f26",
  lineStrong: "#2a303a",
  fg: "#e3e5e9",
  muted: "#8b929d",
  dim: "#5f6672",
  accent: "#e5a93d",
  pos: "#37c58b",
  neg: "#ec5b5b",
  info: "#74b4c8",
  surface: "#0c0e11",
  raised: "#12151a",
  bg: "#07080a",
} as const;
