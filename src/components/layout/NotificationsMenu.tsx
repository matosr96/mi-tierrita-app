import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui";
import { int } from "@/lib/format";
import { useNotifications } from "./useNotifications";
import styles from "./NotificationsMenu.module.css";

/** Campana de la barra superior (prototipo 18 del Figma): pendientes del rol, no leídas y "marcar todas como leídas". */
export const NotificationsMenu = () => {
  const navigate = useNavigate();
  const { items, unread, isPending, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.bell}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.5 a4.8 4.8 0 0 1 4.8 4.8 v3.2 l1.4 2.4 h-12.4 l1.4 -2.4 v-3.2 A4.8 4.8 0 0 1 10 2.5 z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8.2 15.6 a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {unread > 0 ? <span className={styles.count}>{unread > 9 ? "9+" : int(unread)}</span> : null}
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.head}>
            <span className={styles.title}>Notificaciones</span>
            {unread > 0 ? (
              <button type="button" className={styles.markAll} onClick={markAllRead}>
                Marcar todas como leídas
              </button>
            ) : null}
          </div>
          {isPending ? (
            <p className={styles.empty}>Cargando…</p>
          ) : items.length === 0 ? (
            <div className={styles.emptyBox}>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
              <p className={styles.empty}>Todo en orden: no hay pendientes.</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={[styles.item, n.unread ? styles.unread : ""].join(" ")}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                      navigate(n.to);
                    }}
                  >
                    <span className={[styles.dot, styles[n.tone]].join(" ")} aria-hidden="true" />
                    <span className={styles.text}>{n.text}</span>
                    <Badge tone={n.tone}>{n.tag}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className={styles.foot}>Se actualizan con los datos del sistema; lo leído se recuerda en este navegador.</p>
        </div>
      ) : null}
    </div>
  );
};
