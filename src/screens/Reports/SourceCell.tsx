import styles from "./ReportsScreen.module.css";

/** «Ventas #12, #15, +3»: los ids que trae la API (hasta 20) y cuántos más hay. Sin ids, «—». */
export const sourceText = (prefix: string, ids: number[], count: number): string => {
  if (ids.length === 0) return "—";
  const rest = count > ids.length ? `, +${count - ids.length}` : "";
  return `${prefix ? `${prefix} ` : ""}${ids.map((id) => `#${id}`).join(", ")}${rest}`;
};

/** Columna «Origen» de las tablas del documento: de qué registros sale la fila (trazabilidad, brief 2.4 punto 25). */
export const SourceCell = ({ prefix, ids, count }: { prefix: string; ids: number[]; count: number }) => (
  <span className={styles.origin} title={count > ids.length ? `${count} registros en total; se muestran los primeros ${ids.length}` : undefined}>
    {sourceText(prefix, ids, count)}
  </span>
);
