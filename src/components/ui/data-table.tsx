import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./states";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  empty?: { title: string; description?: string; action?: ReactNode };
  maxHeight?: string;
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({ caption, columns, rows, rowKey, empty, maxHeight, rowClassName }: DataTableProps<T>) {
  if (rows.length === 0 && empty) return <EmptyState {...empty} />;
  return (
    <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface">
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "label-caps h-7 whitespace-nowrap px-3 font-medium text-dim",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={cn("border-b border-line/70 transition-colors hover:bg-raised/70", rowClassName?.(row))}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "h-8 whitespace-nowrap px-3 text-fg",
                    c.align === "right" ? "num text-right" : c.align === "center" ? "text-center" : "text-left",
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
