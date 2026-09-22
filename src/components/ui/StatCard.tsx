import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

type Props = { label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" };

/** Tarjeta de indicador (documento 02, sección 5). */
export const StatCard = ({ label, value, hint, tone = "neutral" }: Props) => (
  <div className={[styles.card, tone !== "neutral" ? styles[tone] : ""].join(" ")}>
    <span className={styles.label}>{label}</span>
    <span className={styles.value}>{value}</span>
    {hint !== undefined ? <span className={styles.hint}>{hint}</span> : null}
  </div>
);

export const StatGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
