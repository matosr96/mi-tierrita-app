import styles from "./FlowDiagram.module.css";

/** Un paso del proceso: título, de dónde sale (dos renglones como máximo), resultado y dónde está la tabla que lo respalda. */
export type FlowStep = { title: string; how: string[]; value: string[]; section?: string; tone?: "warn" | "bad" };

const W = 212;
const H = 112;
const GAP_X = 42;
const GAP_Y = 40;

/** Recorte para que un texto quepa en la caja (unos 6,2 px por carácter a 11 px). */
export const fit = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** Posición en serpentina: la fila 1 va de izquierda a derecha, la 2 vuelve y la 3 sigue, para que la cadena no se corte. */
const place = (i: number, cols: number) => {
  const row = Math.floor(i / cols);
  const col = row % 2 === 0 ? i % cols : cols - 1 - (i % cols);
  return { x: col * (W + GAP_X), y: row * (H + GAP_Y) };
};

/**
 * Diagrama de un proceso: pasos encadenados con flechas, cada uno con su fórmula o regla, su resultado (cifras de la API,
 * ya formateadas) y la referencia a la tabla que lo respalda. Sirve para mostrar la trazabilidad de un reporte.
 */
export const FlowDiagram = ({ id, steps, cols = 3, caption }: { id: string; steps: FlowStep[]; cols?: number; caption: string }) => {
  const rows = Math.ceil(steps.length / cols);
  const used = Math.min(cols, steps.length);
  const width = used * W + (used - 1) * GAP_X;
  const height = rows * H + (rows - 1) * GAP_Y;
  const marker = `flow-arrow-${id}`;
  const arrows = steps.slice(1).map((_, k) => {
    const a = place(k, cols);
    const b = place(k + 1, cols);
    if (a.y === b.y) {
      const y = a.y + H / 2;
      return b.x > a.x ? `M${a.x + W + 4},${y} L${b.x - 6},${y}` : `M${a.x - 4},${y} L${b.x + W + 6},${y}`;
    }
    const x = a.x + W / 2;
    return `M${x},${a.y + H + 4} L${x},${b.y - 6}`;
  });
  return (
    <figure className={styles.figure}>
      <svg className={styles.svg} viewBox={`-2 -2 ${width + 4} ${height + 4}`} role="img" aria-label={`Proceso en ${steps.length} pasos: ${steps.map((s) => `${s.title}, ${s.value.join(", ")}`).join("; ")}.`}>
        <defs>
          <marker id={marker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className={styles.head} />
          </marker>
        </defs>
        {arrows.map((d) => (
          <path key={d} d={d} className={styles.arrow} markerEnd={`url(#${marker})`} />
        ))}
        {steps.map((s, i) => {
          const { x, y } = place(i, cols);
          return (
            <g key={s.title} transform={`translate(${x},${y})`}>
              <rect width={W} height={H} rx={10} className={[styles.box, s.tone ? styles[`box_${s.tone}`] : ""].join(" ")} />
              <circle cx={18} cy={18} r={11} className={styles.badge} />
              <text x={18} y={22} textAnchor="middle" className={styles.badgeText}>
                {i + 1}
              </text>
              <text x={36} y={23} className={styles.title}>
                {s.title}
              </text>
              {s.section ? (
                <text x={W - 10} y={23} textAnchor="end" className={styles.section}>
                  {s.section}
                </text>
              ) : null}
              {s.how.map((line, k) => (
                <text key={k} x={12} y={46 + k * 14} className={styles.how}>
                  {line}
                </text>
              ))}
              {s.value.map((line, k) => (
                <text key={k} x={12} y={s.value.length > 1 ? 84 + k * 16 : 92} className={[styles.value, s.tone ? styles[`value_${s.tone}`] : ""].join(" ")}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
};
