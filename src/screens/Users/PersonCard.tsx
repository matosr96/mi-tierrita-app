import { Badge, Button, UserAvatar } from "@/components/ui";
import { dateOnly } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { User } from "@/types/api";
import { PersonName } from "@/components/people/PersonName";
import styles from "./PersonCard.module.css";

type Props = { user: User; isMe: boolean; onChangePassword?: () => void };

/** Tarjeta de una cuenta: iniciales, nombre, usuario, rol, estado y fecha de alta. */
export const PersonCard = ({ user, isMe, onChangePassword }: Props) => (
  <li className={[styles.card, user.active ? "" : styles.inactive, isMe ? styles.me : ""].join(" ")}>
    <div className={styles.top}>
      <UserAvatar user={user} size={36} className={styles.avatar} />
      <div className={styles.who}>
        <h3 className={styles.name}>
          <PersonName userId={user.id}>{`${user.firstName} ${user.lastName}`}</PersonName>
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
