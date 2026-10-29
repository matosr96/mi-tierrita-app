import { initials } from "@/lib/format";
import { openPersonCard } from "@/stores/personCard";
import styles from "./Avatar.module.css";

type Props = { first: string; last: string; online?: boolean | undefined; size?: "sm" | "md"; /** Con `userId` el avatar abre la ficha de la persona. */ userId?: number | undefined };

/** Iniciales de la persona; con `online` muestra el punto de presencia y con `userId` abre su ficha. */
export const Avatar = ({ first, last, online, size = "md", userId }: Props) => {
  const body = (
    <>
      {initials(first, last)}
      {online !== undefined ? <i className={[styles.presence, online ? styles.isOnline : ""].join(" ")} aria-label={online ? "En línea" : "Desconectado"} /> : null}
    </>
  );
  const cls = [styles.avatar, size === "sm" ? styles.sm : ""].join(" ");
  if (userId === undefined)
    return (
      <span className={cls} aria-hidden={online === undefined ? true : undefined}>
        {body}
      </span>
    );
  return (
    <button
      type="button"
      className={[cls, styles.clickable].join(" ")}
      aria-label={`Ver la ficha de ${first} ${last}`}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        openPersonCard(userId, e.currentTarget);
      }}
    >
      {body}
    </button>
  );
};
