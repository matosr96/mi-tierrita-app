import { useEffect, useRef, useState } from "react";
import { SplitText } from "@/components/motion";
import { CHAPTERS } from "./content";
import styles from "./Landing.module.css";

/** Capítulo visible según el avance (mismas mesetas que la escena 3D). */
const chapterIndex = (p: number) => (p < 0.32 ? 0 : p < 0.68 ? 1 : 2);

/**
 * "El sistema por dentro": sección alta con la escena 3D fija mientras se hace scroll. Las cajas pasan de estante
 * de lotes a circuito de ventas y a barras de la decisión; el texto cambia con ellas.
 */
export const LandingSystem = () => {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let disposed = false;
    let scene: { setProgress: (p: number) => void; destroy: () => void } | null = null;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / (r.height - window.innerHeight), 0), 1);
      setProgress(p);
      scene?.setProgress(p);
    };
    void import("./lotsScene").then(({ createLotsScene }) => {
      if (disposed || !canvasRef.current) return;
      scene = createLotsScene(canvasRef.current);
      measure();
    });
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      scene?.destroy();
    };
  }, []);

  const active = chapterIndex(progress);

  return (
    <section ref={ref} className={styles.system} id="sistema" aria-labelledby="sistema-title">
      <div className={styles.systemSticky}>
        <canvas ref={canvasRef} className={styles.systemCanvas} aria-hidden="true" />
        <div className={styles.systemText}>
          <span className={styles.eyebrow}>
            <span>02</span>El sistema por dentro
          </span>
          <h2 id="sistema-title" className={styles.systemTitle}>
            <SplitText text={"Leer el negocio,\n*decidir si crecer.*"} />
          </h2>
          <ol className={styles.chapters}>
            {CHAPTERS.map((c, i) => (
              <li key={c.code} className={i === active ? styles.chapterOn : ""} aria-current={i === active ? "step" : undefined}>
                <div className={styles.chapterHead}>
                  <span className={styles.chapterCode}>{c.code}</span>
                  <span className={styles.chapterEyebrow}>{c.eyebrow}</span>
                </div>
                <h3>
                  {c.title} <em>{c.accent}</em>
                </h3>
                <div className={styles.chapterBody}>
                  <div>
                    <p>{c.text}</p>
                    <ul>
                      {c.points.map((pt) => (
                        <li key={pt}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.systemLegend} aria-hidden="true">
          {active === 0 ? (
            <>
              <i className={styles.lgBad} />
              Vencido <i className={styles.lgWarn} />
              Por vencer <i className={styles.lgOk} />
              Al día
            </>
          ) : active === 1 ? (
            <>
              <i className={styles.lgOk} />
              Contado <i className={styles.lgWarn} />
              Crédito
            </>
          ) : (
            <>
              <i className={styles.lgOk} />
              Escenario que conviene
            </>
          )}
        </div>
      </div>
    </section>
  );
};
