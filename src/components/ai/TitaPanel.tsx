import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAiStore } from "@/stores/ai";
import { TitaAvatar } from "./TitaAvatar";
import { TitaConversation } from "./TitaConversation";
import styles from "./TitaPanel.module.css";

/** Acceso rápido a Tita desde cualquier pantalla (botón de la barra o ⌘J). La misma conversación sigue en /tita. */
export const TitaPanel = () => {
  const open = useAiStore((s) => s.open);
  const setOpen = useAiStore((s) => s.setOpen);
  const hasMessages = useAiStore((s) => s.messages.length > 0);
  const reset = useAiStore((s) => s.reset);
  const location = useLocation();
  const onPage = location.pathname === "/tita";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // En la página de Tita el panel sobra: la conversación ya está a la vista.
  if (!open || onPage) return null;

  return (
    <>
      <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={styles.panel} role="dialog" aria-modal="false" aria-label="Tita, asistente de Mi Tierrita">
        <header className={styles.head}>
          <TitaAvatar size={40} />
          <div className={styles.headText}>
            <strong>Tita</strong>
            <small>Asistente</small>
          </div>
          <Link to="/tita" className={styles.fullLink} onClick={() => setOpen(false)}>
            Pantalla completa
          </Link>
          {hasMessages ? (
            <button type="button" className={styles.textBtn} onClick={reset}>
              Nueva
            </button>
          ) : null}
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Cerrar a Tita">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 2.5 L11.5 11.5 M11.5 2.5 L2.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <TitaConversation compact onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
};
