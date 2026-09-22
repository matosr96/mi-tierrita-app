import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export type Column<T> = { key: string; header: ReactNode; align?: "left" | "right" | "center"; render: (row: T) => ReactNode; width?: string };

type Props<T> = { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; onRowClick?: (row: T) => void; footer?: ReactNode };

const cls = (align: Column<unknown>["align"]) => (align === "right" ? styles.right : align === "center" ? styles.center : align === "left" ? styles.left : "");

/** Tabla del lienzo: numérica a la derecha, primera columna a la izquierda, cabecera 11,5px. */
export const DataTable = <T,>({ columns, rows, rowKey, onRowClick, footer }: Props<T>) => (
  <div className={styles.wrap}>
    <table className={[styles.table, onRowClick ? styles.clickable : ""].join(" ")}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={cls(c.align)} style={c.width ? { width: c.width } : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((c) => (
              <td key={c.key} className={cls(c.align)}>
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer !== undefined ? <tfoot>{footer}</tfoot> : null}
    </table>
  </div>
);
