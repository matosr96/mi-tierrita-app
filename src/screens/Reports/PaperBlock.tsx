import type { ReactNode } from "react";
import styles from "./ReportsScreen.module.css";

/** Bloque de la columna principal del documento (gráfico o tabla) con su rótulo en mayúsculas y una nota opcional. */
export const PaperBlock = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className={styles.block}>
    <div className={styles.blockHead}>
      <span className={styles.sectionLabel}>{label}</span>
      {hint ? <span className={styles.blockHint}>{hint}</span> : null}
    </div>
    {children}
  </div>
);
