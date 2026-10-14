import { useEffect, useState } from "react";
import styles from "./Preloader.module.css";

const KEY = "mi-tierrita-intro";
const DURATION = 1500;

const alreadyShown = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const markShown = () => {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* sin almacenamiento: la intro se verá de nuevo, sin más */
  }
};

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Intro de la primera carga de la sesión: contador 0→100 % y cortina que sube dejando ver la app. */
export const Preloader = () => {
  const [visible, setVisible] = useState(() => !alreadyShown() && !reducedMotion());
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    markShown();
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      setProgress(Math.round(easeInOut(t) * 100));
      if (t < 1) frame = requestAnimationFrame(tick);
      else setLeaving(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className={[styles.root, leaving ? styles.leaving : ""].join(" ")} onAnimationEnd={(e) => e.target === e.currentTarget && leaving && setVisible(false)} aria-hidden="true">
      <div className={styles.top}>
        <span>Mi Tierrita</span>
        <span>Agropecuaria · Sahagún</span>
      </div>
      <div className={styles.center}>
        <span className={styles.line}>
          <span>Inventario, ventas y cartera,</span>
        </span>
        <span className={styles.line}>
          <em>con los números a la vista.</em>
        </span>
      </div>
      <div className={styles.bottom}>
        <span className={styles.count}>{String(progress).padStart(2, "0")}%</span>
        <span className={styles.bar}>
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </span>
        <span className={styles.meta}>Cargando sistema</span>
      </div>
    </div>
  );
};
