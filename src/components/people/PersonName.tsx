import type { ReactNode } from "react";
import { openPersonCard } from "@/stores/personCard";
import styles from "./PersonName.module.css";

/**
 * Nombre o avatar tocable que abre la ficha de la persona. Se usa dentro de textos y cabeceras; no es para filas que ya
 * son un botón (allí se pone el avatar fuera del botón).
 */
export const PersonName = ({ userId, children, label }: { userId: number; children: ReactNode; label?: string }) => (
  <button
    type="button"
    className={styles.name}
    onClick={(e) => {
      e.stopPropagation();
      openPersonCard(userId, e.currentTarget);
    }}
    aria-label={label}
    aria-haspopup="dialog"
  >
    {children}
  </button>
);
