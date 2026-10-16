import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SplitText } from "@/components/motion";
import { STORE } from "./content";
import styles from "./Landing.module.css";

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

const whatsappLink = () => (STORE.whatsapp ? `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hola, Mi Tierrita. Quisiera hacer un pedido.")}` : "");

/**
 * Héroe en tres actos ligados al scroll (la escena 3D queda fija mientras tanto):
 *  1. Unas manos con un puñado de tierra (foto real) emergen de las nubes junto al titular.
 *  2. El titular se va y aparece MI TIERRITA en letras enormes: la foto se ve a través de ellas.
 *  3. La neblina sube, cubre todo y da paso al catálogo.
 */
export const LandingHero = () => {
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;
    let scene: { setScroll: (p: number) => void; destroy: () => void } | null = null;
    const update = () => {
      const el = ref.current;
      const stage = stageRef.current;
      if (!el || !stage) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / Math.max(r.height - window.innerHeight, 1), 0), 1);
      scene?.setScroll(p);
      // El DOM se anima con variables CSS (sin re-renderizar React en cada scroll).
      stage.style.setProperty("--intro", String(1 - smooth(0.04, 0.26, p)));
      stage.style.setProperty("--mark", String(smooth(0.26, 0.44, p) * (1 - smooth(0.82, 0.96, p))));
      stage.style.setProperty("--mark-scale", String(1 + (1 - smooth(0.26, 0.66, p)) * 5));
      stage.style.setProperty("--mist", String(smooth(0.74, 0.98, p)));
    };
    // three.js solo se descarga al abrir la página pública.
    void import("./photoScene").then(({ createPhotoScene }) => {
      if (disposed || !canvasRef.current) return;
      scene = createPhotoScene(canvasRef.current, () => !disposed && setReady(true));
      update();
    });
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      disposed = true;
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      scene?.destroy();
    };
  }, []);

  const wa = whatsappLink();

  return (
    <section ref={ref} className={styles.hero} id="inicio" aria-label="Mi Tierrita">
      <div ref={stageRef} className={styles.heroStage}>
        <canvas ref={canvasRef} className={[styles.heroCanvas, ready ? styles.heroCanvasOn : ""].join(" ")} aria-hidden="true" />
        <div className={styles.heroShade} aria-hidden="true" />

        {/* Acto 2: la palabra calada deja ver la isla a través de sus letras. */}
        <div className={styles.wordmark} aria-hidden="true">
          <svg className={styles.wordmarkWide} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="hero-wordmark">
                <rect width="1600" height="900" fill="white" />
                <text x="800" y="500" textAnchor="middle" className={styles.wordmarkText}>
                  MI TIERRITA
                </text>
              </mask>
            </defs>
            <rect width="1600" height="900" className={styles.wordmarkFill} mask="url(#hero-wordmark)" />
            <text x="800" y="500" textAnchor="middle" className={[styles.wordmarkText, styles.wordmarkStroke].join(" ")}>
              MI TIERRITA
            </text>
          </svg>
          {/* Versión vertical para pantallas angostas: la palabra en dos líneas. */}
          <svg className={styles.wordmarkTall} viewBox="0 0 900 1600" preserveAspectRatio="xMidYMid slice">
            <defs>
              <mask id="hero-wordmark-tall">
                <rect width="900" height="1600" fill="white" />
                <text x="450" y="730" textAnchor="middle" className={[styles.wordmarkText, styles.wordmarkTextTall].join(" ")}>
                  MI
                </text>
                <text x="450" y="890" textAnchor="middle" className={[styles.wordmarkText, styles.wordmarkTextTall].join(" ")}>
                  TIERRITA
                </text>
              </mask>
            </defs>
            <rect width="900" height="1600" className={styles.wordmarkFill} mask="url(#hero-wordmark-tall)" />
          </svg>
          <span className={styles.wordmarkSub}>Agropecuaria · {STORE.city}</span>
        </div>

        {/* Acto 1: titular y acciones. */}
        <div className={styles.heroInner}>
          <span className={styles.pill}>
            <span className={styles.liveDot} aria-hidden="true" />
            Insumos agropecuarios · {STORE.city}
          </span>
          <h1 className={styles.heroTitle}>
            <SplitText text={"Todo para el campo,\ncon información que\n*siembra decisiones.*"} delay={700} stagger={70} />
          </h1>
          <p className={styles.heroLead}>La tienda de siempre, ahora con un sistema que cuida la mercancía, el dinero y la decisión de crecer.</p>
          <div className={styles.heroActions}>
            <a href="#catalogo" className={styles.btnPrimary}>
              Ver el catálogo
              <span aria-hidden="true">↓</span>
            </a>
            {wa ? (
              <a href={wa} className={styles.btnGhost} target="_blank" rel="noreferrer">
                Pedir por WhatsApp
              </a>
            ) : null}
            <Link to="/iniciar-sesion" className={styles.btnGhost}>
              Ingresar al sistema
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className={styles.heroFoot}>
          <span>Proyecto de grado · Ingeniería de Software · Universidad de Cartagena</span>
          <span className={styles.scrollCue} aria-hidden="true">
            <span />
          </span>
          <span>Desplace para ver más de cerca</span>
        </div>

        {/* Acto 3: la neblina cubre todo antes del catálogo. */}
        <div className={styles.mist} aria-hidden="true" />
      </div>
    </section>
  );
};
