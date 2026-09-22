import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

type Props = { label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" };

/** Tarjeta de indicador del lienzo: etiqueta 11,5px, valor serif 24px, nota 11px; el tono malo enmarca en rojo. */
export const StatCard = ({ label, value, hint, tone = "neutral" }: Props) => (
  <div className={[styles.card, tone !== "neutral" ? styles[tone] : ""].join(" ")}>
    <div className={styles.label}>{label}</div>
    <div className={styles.value}>{value}</div>
    {hint !== undefined ? <div className={styles.hint}>{hint}</div> : null}
  </div>
);

export const StatGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
