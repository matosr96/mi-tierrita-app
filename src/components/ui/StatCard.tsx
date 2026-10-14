import type { ReactNode } from "react";
import { Odometer, trackSpotlight } from "@/components/motion";
import styles from "./StatCard.module.css";

type Props = { label: string; value: ReactNode; hint?: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" };

/** Tarjeta de indicador: etiqueta mono, cifra grande que rueda como odómetro y nota; el tono pinta la línea inferior. */
export const StatCard = ({ label, value, hint, tone = "neutral" }: Props) => (
  <div className={[styles.card, tone !== "neutral" ? styles[tone] : ""].join(" ")} onPointerMove={trackSpotlight}>
    <div className={styles.label}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </div>
    <div className={styles.value}>{typeof value === "string" && /\d/.test(value) ? <Odometer value={value} /> : value}</div>
    {hint !== undefined ? <div className={styles.hint}>{hint}</div> : null}
    <span className={styles.line} aria-hidden="true" />
  </div>
);

export const StatGrid = ({ children }: { children: ReactNode }) => <div className={styles.grid}>{children}</div>;
