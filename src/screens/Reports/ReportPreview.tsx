import type { ReactNode } from "react";
import styles from "./ReportPreview.module.css";

type Props = { subtitle: string; filters: ReactNode; actions?: ReactNode; children: ReactNode };

/** Vista previa: barra de mando compacta (filtros y exportación) y el documento apoyado sobre el escritorio. */
export const ReportPreview = ({ subtitle, filters, actions, children }: Props) => (
  <div className={styles.preview}>
    <div className={styles.bar} role="toolbar" aria-label="Parámetros del reporte">
      <span className={styles.tag}>
        <span className={styles.dot} aria-hidden="true" />
        Vista previa
      </span>
      <div className={styles.filters}>{filters}</div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
    <p className={styles.caption}>{subtitle}</p>
    <div className={styles.desk}>{children}</div>
  </div>
);
