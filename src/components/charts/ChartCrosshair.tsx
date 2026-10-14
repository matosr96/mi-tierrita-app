import styles from "./charts.module.css";

type Props = { x: number; y: number; top: number; bottom: number };

/**
 * Línea vertical de lectura con el punto activo resaltado (halo lima). Va dentro del SVG; se desplaza con
 * `transform` para que el salto entre puntos sea un deslizamiento corto.
 */
export const ChartCrosshair = ({ x, y, top, bottom }: Props) => (
  <g className={styles.crosshair} style={{ transform: `translate(${x}px, 0px)` }} aria-hidden="true">
    <line x1={0} x2={0} y1={top} y2={bottom} className={styles.crossLine} />
    <g className={styles.crossMove} style={{ transform: `translate(0px, ${y}px)` }}>
      <circle cx={0} cy={0} r={11} className={styles.crossHalo} />
      <circle cx={0} cy={0} r={5} className={styles.crossDot} />
    </g>
  </g>
);
