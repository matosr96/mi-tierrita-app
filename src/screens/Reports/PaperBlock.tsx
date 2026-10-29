import type { ReactNode } from "react";
import styles from "./ReportPaper.module.css";

/** Bloque numerado de la columna principal del documento (gráfico o tabla) con su rótulo y una nota opcional. */
export const PaperBlock = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className={styles.block} data-print-block="">
    <div className={styles.blockHead}>
      <h4 className={styles.sectionLabel}>{label}</h4>
      {hint ? <span className={styles.blockHint}>{hint}</span> : null}
    </div>
    {children}
  </div>
);
