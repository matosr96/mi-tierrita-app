import type { CSSProperties, ReactNode } from "react";
import { ChartFrame } from "./ChartFrame";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

export type DonutSlice = {
  label: string;
  value: number;
  tone: "good" | "warn" | "bad" | "accent" | "muted";
};

type Props = {
  data: DonutSlice[];
  format: (v: number) => string;
  /** Cifra y rótulo del centro (por ejemplo, el total que devuelve la API). */
  center?: ReactNode;
  centerLabel?: string;
  /** Nombre accesible del gráfico. */
  title?: string;
};

/**
 * Dona de proporciones con leyenda: cada tramo se dibuja una vez al montar; los valores se muestran tal como llegan.
 * Pasar el puntero, tocar o tabular un tramo (o su entrada de la leyenda) muestra su valor en la etiqueta flotante.
 */
export const DonutChart = ({ data, format, center, centerLabel, title }: Props) => {
  const hover = useChartHover();
  const sum = data.reduce((acc, d) => acc + Math.max(d.value, 0), 0);
  const starts: number[] = [];
  let offset = 0;
  data.forEach((d) => {
    starts.push(offset);
    offset += sum > 0 ? (Math.max(d.value, 0) / sum) * 100 : 0;
  });
  const shareOf = (d: DonutSlice) => (sum > 0 ? (Math.max(d.value, 0) / sum) * 100 : 0);
  const ai = hover.active;
  const active = ai !== null ? data[ai] : undefined;
  // Punto medio del tramo activo sobre el anillo (el anillo gira -90° dentro del SVG, así el 0 % queda arriba).
  const angle = active && ai !== null ? (((starts[ai] ?? 0) + shareOf(active) / 2) / 100) * 2 * Math.PI - Math.PI / 2 : 0;
  const anchor = active ? { x: 60 + 46 * Math.cos(angle), y: 60 + 46 * Math.sin(angle) } : null;
  return (
    <div className={[styles.donut, ai !== null ? styles.dimming : ""].join(" ")} role="group" aria-label={title ?? data.map((d) => `${d.label}: ${format(d.value)}`).join(", ")}>
      <div className={styles.donutRing}>
        <ChartFrame svgRef={hover.svgRef} anchor={anchor} tip={active ? { label: active.label, value: format(active.value) } : null}>
          <svg ref={hover.svgRef} viewBox="0 0 120 120" className={styles.donutSvg}>
            <g transform="rotate(-90 60 60)">
              <circle cx="60" cy="60" r="46" className={styles.donutTrack} />
              {sum > 0
                ? data.map((d, i) => {
                    const share = shareOf(d);
                    return (
                      <circle
                        key={d.label}
                        cx="60"
                        cy="60"
                        r="46"
                        pathLength={100}
                        className={[styles.donutSlice, styles.item, styles[`tone_${d.tone}`]].join(" ")}
                        strokeDasharray={`${Math.max(share - 0.6, 0)} ${100 - Math.max(share - 0.6, 0)}`}
                        strokeDashoffset={-(starts[i] ?? 0)}
                        style={{ "--i": i } as CSSProperties}
                        role="img"
                        aria-label={`${d.label}: ${format(d.value)}`}
                        {...hover.itemProps(i)}
                      />
                    );
                  })
                : null}
            </g>
          </svg>
        </ChartFrame>
        {center !== undefined ? (
          <div className={styles.donutCenter}>
            <strong>{center}</strong>
            {centerLabel ? <span>{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <ul className={styles.donutLegend}>
        {data.map((d, i) => (
          <li key={d.label} className={styles.item} data-on={ai === i ? "" : undefined} onPointerEnter={() => hover.setActive(i)} onPointerLeave={() => hover.setActive((a) => (a === i ? null : a))}>
            <i className={styles[`tone_${d.tone}`]} aria-hidden="true" />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
};
