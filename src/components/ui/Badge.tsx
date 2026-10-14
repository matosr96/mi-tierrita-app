import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export const Badge = ({ tone = "neutral", children }: { tone?: "neutral" | "good" | "warn" | "bad"; children: ReactNode }) => (
  <span className={[styles.badge, styles[tone]].join(" ")}>
    <span className={styles.dot} aria-hidden="true" />
    {children}
  </span>
);
