import type { ReactNode } from "react";
import styles from "./SidePanel.module.css";

/** Panel lateral del chat (hilo, fijados): columna a la derecha en escritorio y hoja superpuesta en pantallas angostas. */
export const SidePanel = ({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) => (
  <aside className={styles.panel} aria-label={title}>
    <header className={styles.head}>
      <div>
        <h3>{title}</h3>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      <button type="button" onClick={onClose} aria-label={`Cerrar ${title.toLowerCase()}`} title="Cerrar">
        ×
      </button>
    </header>
    <div className={styles.body}>{children}</div>
    {footer}
  </aside>
);
