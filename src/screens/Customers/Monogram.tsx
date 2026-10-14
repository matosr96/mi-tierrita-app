import styles from "./Monogram.module.css";

const TINTS = 6;

/** Iniciales de las dos primeras palabras del nombre (presentación, no dato de negocio). */
export const monogramOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase() || "·";

/** Avatar circular con las iniciales del cliente; el tono sale del id para que cada cliente conserve el suyo. */
export const Monogram = ({ id, name, size = "md", muted = false, onDark = false }: { id: number; name: string; size?: "md" | "lg"; muted?: boolean; onDark?: boolean }) => (
  <span className={[styles.mono, styles[`t${id % TINTS}`], size === "lg" ? styles.lg : "", muted ? styles.muted : "", onDark ? styles.onDark : ""].join(" ")} aria-hidden="true">
    <span className={styles.ring} />
    {monogramOf(name)}
  </span>
);
