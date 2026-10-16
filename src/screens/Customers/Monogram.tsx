import styles from "./Monogram.module.css";

/** Iniciales de las dos primeras palabras del nombre (presentación, no dato de negocio). */
export const monogramOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase() || "·";

/** Avatar circular con las iniciales del cliente. */
export const Monogram = ({ name, size = "md", muted = false }: { name: string; size?: "md" | "lg"; muted?: boolean }) => (
  <span className={[styles.mono, size === "lg" ? styles.lg : "", muted ? styles.muted : ""].join(" ")} aria-hidden="true">
    {monogramOf(name)}
  </span>
);
