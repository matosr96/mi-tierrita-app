import { TitaAvatar } from "./TitaAvatar";
import styles from "./TitaOrb.module.css";

type Props = { size?: number; /** Tita está trabajando: el orbe gira un poco más rápido. */ busy?: boolean; className?: string };

/**
 * Orbe 3D de Tita (brief de octubre de 2026, punto 10): una esfera en los verdes de la marca con dos anillos que giran en
 * perspectiva, hecha solo con CSS (sin WebGL ni librerías), y la plantita en el centro. Lleva `data-motion` porque es
 * la imagen de Tita y su movimiento es parte de ella; con «reducir movimiento» activo queda quieta (regla global).
 */
export const TitaOrb = ({ size = 72, busy = false, className }: Props) => (
  <span className={[styles.orb, busy ? styles.busy : "", className ?? ""].join(" ")} style={{ width: size, height: size }} aria-hidden="true" data-motion>
    <span className={styles.glow} />
    <span className={styles.sphere} />
    <span className={styles.ringA} />
    <span className={styles.ringB} />
    <span className={styles.face}>
      <TitaAvatar size={Math.round(size * 0.58)} thinking={busy} />
    </span>
  </span>
);
