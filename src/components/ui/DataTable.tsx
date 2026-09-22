import type { ReactNode } from "react";
import styles from "./DataTable.module.css";

export type Column<T> = { key: string; header: ReactNode; align?: "left" | "right" | "center"; render: (row: T) => ReactNode; width?: string };

type Props<T> = { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string | number; onRowClick?: (row: T) => void; footer?: ReactNode };

/** Tabla genérica: no sabe de qué entidad son las filas; la pantalla le pasa columnas y datos. */
export const DataTable = <T,>({ columns, rows, rowKey, onRowClick, footer }: Props<T>) => (
  <div className={styles.wrap}>
    <table className={[styles.table, onRowClick ? styles.clickable : ""].join(" ")}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} className={c.align === "right" ? styles.right : c.align === "center" ? styles.center : ""} style={c.width ? { width: c.width } : undefined}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map((c) => (
              <td key={c.key} className={c.align === "right" ? styles.right : c.align === "center" ? styles.center : ""}>
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
