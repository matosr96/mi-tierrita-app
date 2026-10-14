import { useEffect, type ReactNode } from "react";
import styles from "./Modal.module.css";

type Props = { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; viewTransitionName?: string };

/** `viewTransitionName` (opcional) nombra el diálogo solo mientras dura un morfismo de View Transitions; sin él, el diálogo usa su propia entrada. */

export const Modal = ({ open, title, description, onClose, children, footer, wide = false, viewTransitionName }: Props) => {
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
      <div className={[styles.dialog, wide ? styles.wide : "", viewTransitionName ? styles.morph : ""].join(" ")} style={viewTransitionName ? { viewTransitionName } : undefined} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.head}>
          <div>
            <h2>{title}</h2>
            {description ? <p className={styles.desc}>{description}</p> : null}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 2.5 L11.5 11.5 M11.5 2.5 L2.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
        {footer !== undefined ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
};
