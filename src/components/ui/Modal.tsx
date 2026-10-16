import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import styles from "./Modal.module.css";

type Props = { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; viewTransitionName?: string };

/** `viewTransitionName` (opcional) nombra el diálogo solo mientras dura un morfismo de View Transitions; sin él, el diálogo usa su propia entrada. */

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ({ open, title, description, onClose, children, footer, wide = false, viewTransitionName }: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Control que abrió el diálogo: se toma al render de apertura, antes de que un campo con autoFocus se lleve el foco.
  const openerRef = useRef<HTMLElement | null>(null);
  if (open && openerRef.current === null && document.activeElement instanceof HTMLElement) openerRef.current = document.activeElement;

  // Foco: entra al diálogo al abrir (si un campo no lo tomó ya) y vuelve al control que lo abrió al cerrar.
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus();
    return () => {
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  // Tab y Shift+Tab dan la vuelta dentro del diálogo en vez de salir a la página de atrás.
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;
  return (
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={[styles.dialog, wide ? styles.wide : "", viewTransitionName ? styles.morph : ""].join(" ")} style={viewTransitionName ? { viewTransitionName } : undefined} role="dialog" aria-modal="true" aria-label={title} ref={dialogRef} tabIndex={-1} onKeyDown={trapTab}>
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
