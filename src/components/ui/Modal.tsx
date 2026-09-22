import { useEffect, type ReactNode } from "react";
import styles from "./Modal.module.css";

type Props = { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean };

export const Modal = ({ open, title, description, onClose, children, footer, wide = false }: Props) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={[styles.dialog, wide ? styles.wide : ""].join(" ")} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <div>
            <h2>{title}</h2>
            {description ? <p className={styles.desc}>{description}</p> : null}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
        {footer !== undefined ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
};
