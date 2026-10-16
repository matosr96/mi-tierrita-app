import type { CSSProperties, ReactNode } from "react";
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

/** Dona de proporciones con leyenda: cada tramo se dibuja una vez al montar; los valores se muestran tal como llegan. */
export const DonutChart = ({
  data,
  format,
  center,
  centerLabel,
  title,
}: Props) => {
  const sum = data.reduce((acc, d) => acc + Math.max(d.value, 0), 0);
  let offset = 0;
  return (
    <div
      className={styles.donut}
      role="img"
      aria-label={
        title ?? data.map((d) => `${d.label}: ${format(d.value)}`).join(", ")
      }
    >
      <div className={styles.donutRing}>
        <svg
          viewBox="0 0 120 120"
          className={styles.donutSvg}
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="46" className={styles.donutTrack} />
          {sum > 0
            ? data.map((d, i) => {
                const share = (Math.max(d.value, 0) / sum) * 100;
                const el = (
                  <circle
                    key={d.label}
                    cx="60"
                    cy="60"
                    r="46"
                    pathLength={100}
                    className={[
                      styles.donutSlice,
                      styles[`tone_${d.tone}`],
                    ].join(" ")}
                    strokeDasharray={`${Math.max(share - 0.6, 0)} ${100 - Math.max(share - 0.6, 0)}`}
                    strokeDashoffset={-offset}
                    style={{ "--i": i } as CSSProperties}
                  />
                );
                offset += share;
                return el;
              })
            : null}
        </svg>
        {center !== undefined ? (
          <div className={styles.donutCenter}>
            <strong>{center}</strong>
            {centerLabel ? <span>{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>
      <ul className={styles.donutLegend}>
        {data.map((d) => (
          <li key={d.label}>
            <i className={styles[`tone_${d.tone}`]} aria-hidden="true" />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
};
