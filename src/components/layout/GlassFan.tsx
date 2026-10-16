import type { CSSProperties } from "react";
import styles from "./GlassFan.module.css";

/** Ángulos de las cápsulas (el abanico se abre hacia arriba) y cuáles van en verde sólido, como en la referencia. */
const BLADES = [-72, -48, -24, 0, 24, 48, 72].map((deg, i) => ({ deg, solid: i >= 4 }));

/** Figura decorativa de cápsulas de vidrio en abanico (la escultura azul de Clerio, en verde). Estática. */
export const GlassFan = ({ className }: { className?: string }) => (
  <div className={[styles.fan, className ?? ""].join(" ")} aria-hidden="true">
    {BLADES.map((b) => (
      <span key={b.deg} className={[styles.blade, b.solid ? styles.solid : ""].join(" ")} style={{ "--deg": `${b.deg}deg` } as CSSProperties}>
        <i />
      </span>
    ))}
  </div>
);
