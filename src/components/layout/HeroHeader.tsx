import { useEffect, useState, type ReactNode } from "react";
import { PhotoBackdrop, ShaderField, SplitText, TopoField, trackSpotlight } from "@/components/motion";
import { HERO_PHOTOS } from "@/lib/media";
import styles from "./HeroHeader.module.css";

type Props = {
  eyebrow: string;
  /** Titular; `*así*` en serif cursiva y `\n` para saltar de línea. */
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Bloque a la derecha (por ejemplo, la cifra del día). */
  aside?: ReactNode;
};

const clock = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/** Portada oscura de una pantalla (Inicio): curvas de nivel animadas, reloj en vivo y titular que entra por palabras. */
export const HeroHeader = ({ eyebrow, title, subtitle, actions, aside }: Props) => {
  const [now, setNow] = useState(clock);
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className={styles.hero} onPointerMove={trackSpotlight}>
      <ShaderField className={styles.shader} intensity={0.85} />
      <div className={styles.photos}>
        <PhotoBackdrop photos={HERO_PHOTOS} />
      </div>
      <TopoField className={styles.topo} rings={14} signal={7} seed={1.7} />
      <div className={styles.glow} aria-hidden="true" />
      <span className={[styles.corner, styles.tl].join(" ")} aria-hidden="true" />
      <span className={[styles.corner, styles.br].join(" ")} aria-hidden="true" />

      <div className={styles.top}>
        <span className={styles.eyebrow}>
          <span className={styles.live} aria-hidden="true" />
          {eyebrow}
        </span>
        <span className={styles.clock}>{now}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.main}>
          <h1 className={styles.title}>
            <SplitText key={title} text={title} delay={120} stagger={65} />
          </h1>
          {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
        {aside ? <div className={styles.aside}>{aside}</div> : null}
      </div>
    </header>
  );
};
