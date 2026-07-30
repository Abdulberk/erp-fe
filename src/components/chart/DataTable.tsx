import { formatCell } from "@/lib/format";
import type { ChartRow, TableColumn } from "./types";

interface Props {
  columns: TableColumn[];
  rows: ChartRow[];
  caption?: string;
  /** Yapışkan ilk kolon — geniş tablolarda satır kimliği kaybolmasın. */
  stickyFirst?: boolean;
}

function isNumeric(col: TableColumn): boolean {
  if (col.align) return col.align === "right";
  return col.unit !== undefined && col.unit !== "";
}

/**
 * Her grafiğin tablo karşılığı. Bu erişilebilirlik gereği ve light modda
 * kontrast kuralının şartı — düşük kontrastlı seriler (aqua, sarı) yalnızca
 * renkle değil, burada da okunabilir olmak zorunda.
 */
export function DataTable({ columns, rows, caption, stickyFirst = false }: Props) {
  return (
    <div className="scroll-x rounded-lg border border-border">
      <table className="w-full min-w-max border-collapse text-[12px]">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-border bg-page">
            {columns.map((col, i) => (
              <th
                key={col.key}
                scope="col"
                className={[
                  "px-3 py-2 font-medium whitespace-nowrap text-ink-2",
                  isNumeric(col) ? "text-right" : "text-left",
                  stickyFirst && i === 0
                    ? "sticky left-0 z-10 bg-page"
                    : "",
                ].join(" ")}
              >
                {col.label}
                {col.unit ? (
                  <span className="ml-1 font-normal text-ink-muted">
                    ({col.unit})
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className="border-b border-border last:border-b-0 hover:bg-hover"
            >
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  className={[
                    "px-3 py-1.5 whitespace-nowrap",
                    isNumeric(col)
                      ? "tnum text-right text-ink-1"
                      : "text-left text-ink-2",
                    stickyFirst && i === 0
                      ? "sticky left-0 z-10 bg-surface-1 font-medium text-ink-1"
                      : "",
                  ].join(" ")}
                >
                  {formatCell(row[col.key], col.unit ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
