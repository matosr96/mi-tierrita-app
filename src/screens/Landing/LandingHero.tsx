import { useEffect, useRef } from "react";
import { SplitText } from "./motion";
import { DashboardMock, MiniBars } from "./DashboardMock";
import { LINES, STORE } from "./content";
import styles from "./LandingHero.module.css";

/**
 * Héroe centrado: titular, subtítulo, dos botones y, debajo, una pantalla ilustrativa del sistema con un halo verde
 * pastel y tarjetas flotantes. La pantalla empieza inclinada en perspectiva y se endereza a medida que se hace scroll
 * (variable --p de 0 a 1, escrita desde un listener de scroll con requestAnimationFrame).
 */
export const LandingHero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const stage = stageRef.current;
    if (!hero || !stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      hero.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 cuando el borde superior del monitor está en el 85 % de la ventana; 1 cuando llega al 15 %.
      const p = Math.min(Math.max((vh * 0.85 - r.top) / (vh * 0.7), 0), 1);
      hero.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={heroRef} className={styles.hero} id="inicio" aria-labelledby="inicio-title">
      <div className={styles.copy}>
        <span className={styles.badge}>
          <i aria-hidden="true" />
          {STORE.kind} · {STORE.city}
        </span>
        <h1 id="inicio-title" className={styles.title}>
          <SplitText text={"Lo que su finca necesita,\n*con la tienda al día.*"} delay={120} stagger={45} />
        </h1>
        <p className={styles.lead}>
          Alimentos, medicina veterinaria, semillas y herramienta para el campo cordobés. Detrás del mostrador, un sistema propio que cuida lotes,
          ventas y cartera.
        </p>
        <div className={styles.actions}>
          <a href="#catalogo" className={styles.btnFilled}>
            Ver catálogo
            <span aria-hidden="true">→</span>
          </a>
          <a href="#sistema" className={styles.btnOutline}>
            Cómo funciona el sistema
          </a>
        </div>
      </div>

      <div ref={stageRef} className={styles.stage}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.monitor}>
          <DashboardMock />
        </div>

        <div className={[styles.float, styles.floatA].join(" ")} aria-hidden="true">
          <span className={styles.floatLabel}>Lotes por vencer</span>
          <strong>7</strong>
          <span className={styles.floatFoot}>
            <small>esta semana</small>
            <MiniBars values={[30, 46, 38, 62, 50, 74, 58]} tone="warn" />
          </span>
        </div>
        <div className={[styles.float, styles.floatB].join(" ")} aria-hidden="true">
          <span className={styles.floatLabel}>Abonos de hoy</span>
          <strong>$ 640 mil</strong>
          <span className={styles.floatFoot}>
            <small>cartera al día</small>
            <MiniBars values={[24, 36, 30, 48, 56, 52, 80]} />
          </span>
        </div>
        <div className={[styles.float, styles.floatC].join(" ")} aria-hidden="true">
          <span className={styles.check}>✓</span>
          <span>
            <strong>Sale primero el que vence antes</strong>
            <small>Inventario FEFO</small>
          </span>
        </div>
      </div>
      <p className={styles.caption}>Vista ilustrativa del sistema · cifras de ejemplo</p>
      <div className={styles.chips} aria-hidden="true">
        <div className={styles.chipsTrack}>
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.chipsGroup}>
              {LINES.map((l) => (
                <span key={l.code} className={styles.chipItem}>
                  {l.name} {l.accent}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
