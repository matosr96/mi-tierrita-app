import type { ReactNode } from "react";
import styles from "./Callout.module.css";

/** Bloque de conclusión destacada (por ejemplo, "Conviene ampliar"). */
export const Callout = ({ tone = "neutral", title, children, aside }: { tone?: "good" | "warn" | "bad" | "neutral"; title?: string; children?: ReactNode; aside?: ReactNode }) => (
  <div className={[styles.callout, styles[tone]].join(" ")}>
    <div className={styles.body}>
      {title ? <span className={styles.title}>{title}</span> : null}
      {children}
    </div>
    {aside}
  </div>
);
