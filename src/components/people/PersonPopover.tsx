import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { UserAvatar, useModalOpenFlag } from "@/components/ui";
import { useDirectory } from "@/hooks/users";
import { usePersonCardStore } from "@/stores/personCard";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { presenceText } from "./presence";
import styles from "./PersonPopover.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const CARD_W = 320;

/**
 * Ficha de persona (brief de octubre de 2026, punto 30): se abre al tocar un avatar o un nombre en cualquier pantalla.
 * Muestra foto, nombre, rol, usuario, presencia y contacto; las acciones dependen de quien mira: «Escribirle» (todos),
 * «Ver actividad» y «Editar en Usuarios» (solo administración); sobre uno mismo, «Mi perfil». Flotante junto al
 * elemento en escritorio, hoja inferior en móvil; Escape o clic fuera la cierran y el foco vuelve a donde estaba.
 */
export const PersonPopover = () => {
  const userId = usePersonCardStore((s) => s.userId);
  const anchor = usePersonCardStore((s) => s.anchor);
  const close = usePersonCardStore((s) => s.close);
  const me = useSessionStore((s) => s.user);
  const directory = useDirectory();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  const open = userId !== null;
  useModalOpenFlag(open && narrow);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useLayoutEffect(() => {
    if (!open || narrow || !anchor || !ref.current) {
      setPos(null);
      return;
    }
    const h = ref.current.offsetHeight;
    const below = anchor.bottom + 8;
    const top = below + h > window.innerHeight - 8 ? Math.max(8, anchor.top - h - 8) : below;
    const left = Math.min(Math.max(8, anchor.left), window.innerWidth - CARD_W - 8);
    setPos({ top, left });
  }, [open, narrow, anchor, directory.data]);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, close]);

  if (!open || !me) return null;
  const person = directory.data?.find((p) => p.id === userId);
  const isMe = userId === me.id;
  const isAdmin = me.role === "ADMIN";

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const name = person ? `${person.firstName} ${person.lastName}` : "Persona";
  return createPortal(
    <>
      {narrow ? <div className={styles.scrim} aria-hidden="true" /> : null}
      <div
        ref={ref}
        className={[styles.card, narrow ? styles.sheet : ""].join(" ")}
        style={narrow ? undefined : { top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: CARD_W }}
        role="dialog"
        aria-modal={narrow ? "true" : "false"}
        aria-label={`Ficha de ${name}`}
        tabIndex={-1}
        onKeyDown={trapTab}
      >
        {directory.isPending ? (
          <p className={styles.muted}>Cargando…</p>
        ) : !person ? (
          <p className={styles.muted}>No se encontró a esta persona en el equipo.</p>
        ) : (
          <>
            <div className={styles.top}>
              <span className={styles.photo}>
                <UserAvatar user={person} size={56} />
                <i className={[styles.dot, person.online ? styles.on : ""].join(" ")} aria-hidden="true" />
              </span>
              <div className={styles.who}>
                <strong>{name}</strong>
                <span>
                  {ROLE_LABELS[person.role]} · @{person.username}
                </span>
                <span className={person.online ? styles.online : styles.muted}>{person.active ? presenceText(person.online, person.lastSeenAt) : "Cuenta inactiva"}</span>
              </div>
            </div>
            {person.email || person.phone ? (
              <dl className={styles.contact}>
                {person.phone ? (
                  <>
                    <dt>Teléfono</dt>
                    <dd>
                      <a href={`tel:${person.phone.replace(/\s+/g, "")}`}>{person.phone}</a>
                    </dd>
                  </>
                ) : null}
                {person.email ? (
                  <>
                    <dt>Correo</dt>
                    <dd>
                      <a href={`mailto:${person.email}`}>{person.email}</a>
                    </dd>
                  </>
                ) : null}
              </dl>
            ) : (
              <p className={styles.muted}>Sin teléfono ni correo registrados.</p>
            )}
            <div className={styles.actions}>
              {isMe ? (
                <Link to="/perfil" className={styles.primary} onClick={close}>
                  Mi perfil
                </Link>
              ) : person.active ? (
                <Link to={`/chat?con=${person.id}`} className={styles.primary} onClick={close}>
                  Escribirle
                </Link>
              ) : null}
              {isAdmin ? (
                <Link to={`/auditoria?userId=${person.id}`} className={styles.secondary} onClick={close}>
                  Ver actividad
                </Link>
              ) : null}
              {isAdmin && !isMe ? (
                <Link to="/usuarios" className={styles.secondary} onClick={close}>
                  Editar en Usuarios
                </Link>
              ) : null}
            </div>
          </>
        )}
        <button type="button" className={styles.close} onClick={close} aria-label="Cerrar la ficha">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2.5 2.5 L11.5 11.5 M11.5 2.5 L2.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </>,
    document.body,
  );
};
