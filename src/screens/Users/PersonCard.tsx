import { Badge, Button } from "@/components/ui";
import { dateOnly, initials } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { User } from "@/types/api";
import styles from "./PersonCard.module.css";

type Props = { user: User; isMe: boolean; onChangePassword?: () => void };

/** Tarjeta de una cuenta: iniciales, nombre, usuario, rol, estado y fecha de alta. */
export const PersonCard = ({ user, isMe, onChangePassword }: Props) => (
  <li className={[styles.card, user.active ? "" : styles.inactive, isMe ? styles.me : ""].join(" ")}>
    <div className={styles.top}>
      <span className={styles.avatar} aria-hidden="true">
        {initials(user.firstName, user.lastName)}
      </span>
      <div className={styles.who}>
        <h3 className={styles.name}>
          {user.firstName} {user.lastName}
          {isMe ? <span className={styles.you}> (usted)</span> : null}
        </h3>
        <span className={styles.username}>@{user.username}</span>
      </div>
    </div>

    <div className={styles.tags}>
      <Badge tone="neutral">{ROLE_LABELS[user.role]}</Badge>
      <Badge tone={user.active ? "good" : "neutral"}>{user.active ? "Activa" : "Inactiva"}</Badge>
    </div>

    <div className={styles.foot}>
      <span className={styles.since}>Alta {dateOnly(user.createdAt)}</span>
      {isMe && onChangePassword ? (
        <Button variant="secondary" size="sm" onClick={onChangePassword}>
          Cambiar mi contraseña
        </Button>
      ) : null}
    </div>
  </li>
);
