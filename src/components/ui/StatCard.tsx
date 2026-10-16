import type { ReactNode } from "react";
import { Odometer, trackSpotlight } from "@/components/motion";
import { Sparkline } from "@/components/charts/Sparkline";
import styles from "./StatCard.module.css";

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
  /** Serie para el minigráfico de tendencia (por ejemplo, ventas por día). */
  trend?: number[] | undefined;
};

/** Tarjeta de indicador: etiqueta mono, cifra grande que rueda como odómetro y nota; el tono pinta la línea inferior. */
export const StatCard = ({ label, value, hint, tone = "neutral", trend }: Props) => (
  <div className={[styles.card, tone !== "neutral" ? styles[tone] : ""].join(" ")} onPointerMove={trackSpotlight}>
    <div className={styles.label}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
      {trend && trend.length > 1 ? (
        <span className={styles.trend}>
          <Sparkline values={trend} label={`Tendencia de ${label.toLowerCase()}`} />
        </span>
      ) : null}
    </div>
    <div className={styles.value}>{typeof value === "string" && /\d/.test(value) ? <Odometer value={value} /> : value}</div>
    {hint !== undefined ? <div className={styles.hint}>{hint}</div> : null}
    <span className={styles.line} aria-hidden="true" />
  </div>
);

export const StatGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
