import type { CSSProperties } from "react";
import { trackSpotlight } from "@/components/motion";
import { Button } from "@/components/ui";
import { dateOnly, initials } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { Role, User } from "@/types/api";
import styles from "./PersonCard.module.css";

const PALETTES = [styles.p0, styles.p1, styles.p2, styles.p3, styles.p4, styles.p5];
const ROLE_CLASS: Record<Role, string | undefined> = { ADMIN: styles.rAdmin, SALES: styles.rSales, WAREHOUSE: styles.rWarehouse };

/** Fracción pseudoaleatoria estable a partir del id: la misma persona tiene siempre el mismo degradado. */
const frac = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Posición de las dos manchas de luz del monograma (decorativo, no es una cifra de negocio). */
const avatarStyle = (id: number): CSSProperties =>
  ({
    "--x1": `${Math.round(frac(id) * 70 + 10)}%`,
    "--y1": `${Math.round(frac(id + 7) * 50 + 5)}%`,
    "--x2": `${Math.round(frac(id + 13) * 60 + 30)}%`,
    "--y2": `${Math.round(frac(id + 29) * 40 + 55)}%`,
    "--rot": `${Math.round(frac(id + 3) * 360)}deg`,
  }) as CSSProperties;

type Props = { user: User; isMe: boolean; index: number; onChangePassword?: () => void };

/** Tarjeta de una cuenta: monograma con degradado propio, rol, usuario en mono y estado. */
export const PersonCard = ({ user, isMe, index, onChangePassword }: Props) => (
  <li
    className={[styles.card, user.active ? "" : styles.inactive, isMe ? styles.me : ""].join(" ")}
    style={{ "--i": index } as CSSProperties}
    onPointerMove={trackSpotlight}
  >
    <div className={styles.top}>
      <div className={[styles.avatar, PALETTES[user.id % PALETTES.length]].join(" ")} style={avatarStyle(user.id)} aria-hidden="true">
        <span className={styles.initials}>{initials(user.firstName, user.lastName)}</span>
      </div>
      <span className={[styles.status, user.active ? styles.on : styles.off].join(" ")}>
        <span className={styles.statusDot} aria-hidden="true" />
        {user.active ? "Activa" : "Inactiva"}
      </span>
    </div>

    <div className={styles.who}>
      <h3 className={styles.name}>
        {user.firstName} <em>{user.lastName}</em>
      </h3>
      {isMe ? <span className={styles.you}>(usted)</span> : null}
    </div>
    <div className={styles.username}>@{user.username}</div>

    <div className={styles.foot}>
      <span className={[styles.role, ROLE_CLASS[user.role]].join(" ")}>{ROLE_LABELS[user.role]}</span>
      <span className={styles.since}>Alta {dateOnly(user.createdAt)}</span>
    </div>

    {isMe && onChangePassword ? (
      <div className={styles.actions}>
        <Button variant="secondary" size="sm" onClick={onChangePassword}>
          Cambiar mi contraseña
        </Button>
      </div>
    ) : null}
  </li>
);
