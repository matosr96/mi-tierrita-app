import type { ReactNode } from "react";
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

/** Tarjeta de indicador: etiqueta, cifra grande y nota; el tono colorea la cifra y una marca a la izquierda. */
export const StatCard = ({ label, value, hint, tone = "neutral", trend }: Props) => (
  <div className={[styles.card, tone !== "neutral" ? styles[tone] : ""].join(" ")}>
    <div className={styles.label}>
      {tone !== "neutral" ? <span className={styles.dot} aria-hidden="true" /> : null}
      {label}
      {trend && trend.length > 1 ? (
        <span className={styles.trend}>
          <Sparkline values={trend} label={`Tendencia de ${label.toLowerCase()}`} />
        </span>
      ) : null}
    </div>
    <div className={styles.value}>{value}</div>
    {hint !== undefined ? <div className={styles.hint}>{hint}</div> : null}
  </div>
);

export const StatGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
