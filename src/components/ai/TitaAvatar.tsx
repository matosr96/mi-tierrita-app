import styles from "./TitaAvatar.module.css";

type Props = { size?: number; /** Las hojas se mecen mientras Tita revisa los datos. */ thinking?: boolean };

/**
 * Tita, la mascota: una plantita (semilla redonda con carita y dos hojas) sobre un círculo verde claro. Ilustración
 * propia en los verdes de la marca; nada de íconos genéricos de IA. Bajo 32 px se omiten las mejillas para que se lea.
 */
export const TitaAvatar = ({ size = 40, thinking = false }: Props) => (
  <span className={[styles.avatar, thinking ? styles.thinking : ""].join(" ")} style={{ width: size, height: size }} aria-hidden="true" data-motion={thinking ? "" : undefined}>
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <circle cx="32" cy="32" r="32" className={styles.bg} />
      <ellipse cx="32" cy="55.5" rx="15" ry="3.6" className={styles.soil} />
      <g className={styles.leaves}>
        <path d="M32 27 V17" className={styles.stem} />
        <path d="M32 21 C 24.5 21.5 19 17 18 9.5 C 25.5 9 31 13.5 32 21 Z" className={styles.leafA} />
        <path d="M32 18.5 C 39 18.5 44.5 14 45.5 6.5 C 38.5 6.5 33 10.5 32 18.5 Z" className={styles.leafB} />
      </g>
      <ellipse cx="32" cy="40.5" rx="15.5" ry="14.5" className={styles.body} />
      <ellipse cx="27" cy="34.5" rx="5" ry="3" className={styles.shine} />
      <circle cx="26.5" cy="40" r="2" className={styles.eye} />
      <circle cx="37.5" cy="40" r="2" className={styles.eye} />
      {size >= 32 ? (
        <>
          <circle cx="22.8" cy="45" r="2.4" className={styles.cheek} />
          <circle cx="41.2" cy="45" r="2.4" className={styles.cheek} />
        </>
      ) : null}
      <path d="M28.6 45.2 Q32 48.4 35.4 45.2" className={styles.smile} />
    </svg>
  </span>
);
