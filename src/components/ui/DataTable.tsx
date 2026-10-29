import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "./DataTable.module.css";

/** `label` rotula la celda en el modo apilado cuando `header` no es texto (por ejemplo, un rótulo solo para lectores). */
export type Column<T> = { key: string; header: ReactNode; label?: string; align?: "left" | "right" | "center"; render: (row: T) => ReactNode; width?: string };

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
  /** Conserva el desplazamiento horizontal bajo 640 px en vez de apilar las filas (documentos con muchas cifras). */
  scroll?: boolean;
};

const cls = (align: Column<unknown>["align"]) => (align === "right" ? styles.right : align === "center" ? styles.center : align === "left" ? styles.left : "");

const labelOf = <T,>(c: Column<T>): string => (typeof c.header === "string" ? c.header : (c.label ?? ""));

/**
 * Tabla: numérica a la derecha, primera columna a la izquierda. Bajo 640 px cada fila se vuelve una tarjeta con el
 * rótulo de la columna antes de cada valor (`data-label`), salvo con `scroll`.
 */
export const DataTable = <T,>({ columns, rows, rowKey, onRowClick, footer, scroll = false }: Props<T>) => {
  const footRef = useRef<HTMLTableSectionElement>(null);
  const labels = columns.map(labelOf);

  // Los totales llegan como filas armadas por cada pantalla: se rotulan con la columna donde empieza cada celda
  // (contando colSpan). La celda de la primera columna es el título de la fila («Total») y queda sin rótulo.
  useLayoutEffect(() => {
    const foot = footRef.current;
    if (!foot) return;
    for (const tr of Array.from(foot.rows)) {
      tr.setAttribute("role", "row");
      let col = 0;
      for (const td of Array.from(tr.cells)) {
        td.setAttribute("role", "cell");
        td.setAttribute("data-label", col === 0 ? "" : (labels[col] ?? ""));
        col += td.colSpan;
      }
    }
  });

  return (
    <div className={[styles.wrap, scroll ? "" : styles.stack].join(" ")}>
      {/* Roles explícitos: algunos navegadores pierden la semántica de tabla al cambiar su display en el modo apilado. */}
      <table role="table" className={[styles.table, onRowClick ? styles.clickable : ""].join(" ")}>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => (
              <th key={c.key} role="columnheader" className={cls(c.align)} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((row) => (
            <tr key={rowKey(row)} role="row" onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((c, i) => (
                <td key={c.key} role="cell" data-label={labels[i]} className={cls(c.align)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer !== undefined ? (
          <tfoot role="rowgroup" ref={footRef}>
            {footer}
          </tfoot>
        ) : null}
      </table>
    </div>
  );
};
