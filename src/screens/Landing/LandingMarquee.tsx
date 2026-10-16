import { LINES } from "./content";
import styles from "./Landing.module.css";

/** Cinta de líneas de producto (reemplaza la cinta de siglas técnicas del diseño original). */
export const LandingMarquee = () => (
  <div className={styles.marquee} aria-hidden="true">
    <div className={styles.marqueeTrack}>
      {[0, 1].map((copy) => (
        <span key={copy} className={styles.marqueeGroup}>
          {LINES.map((l) => (
            <span key={l.code}>
              {l.name} {l.accent}
              <i>✳</i>
            </span>
          ))}
        </span>
      ))}
    </div>
  </div>
);
