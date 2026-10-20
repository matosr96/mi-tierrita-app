import { initials } from "@/lib/format";
import styles from "./Avatar.module.css";

/** Iniciales de la persona; con `online` muestra el punto de presencia. */
export const Avatar = ({ first, last, online, size = "md" }: { first: string; last: string; online?: boolean | undefined; size?: "sm" | "md" }) => (
  <span className={[styles.avatar, size === "sm" ? styles.sm : ""].join(" ")} aria-hidden={online === undefined ? true : undefined}>
    {initials(first, last)}
    {online !== undefined ? <i className={[styles.presence, online ? styles.isOnline : ""].join(" ")} aria-label={online ? "En línea" : "Desconectado"} /> : null}
  </span>
);
