import { useEffect, useState, type CSSProperties } from "react";
import { SplitText, useInView } from "./motion";
import { CHAPTERS, type Chapter } from "./content";
import { CarteraMock, FefoMock, ScenariosMock } from "./SystemMocks";
import styles from "./Landing.module.css";

const MOCKS = [FefoMock, CarteraMock, ScenariosMock];
/** Duración de cada paso de la animación (coincide con la barra de avance del paso activo en el CSS). */
const STEP_MS = 3400;

/**
 * Un capítulo: texto a un lado y, al otro, una minipantalla que repite en bucle los tres pasos del capítulo mientras
 * está en pantalla. Los pasos también se pueden elegir a mano; con movimiento reducido se queda en el último.
 */
const ChapterRow = ({ chapter, index }: { chapter: Chapter; index: number }) => {
  const [ref, seen] = useInView<HTMLElement>("0px 0px -20% 0px");
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const Mock = MOCKS[index] ?? FefoMock;

  // Solo anima mientras la fila está a la vista.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(2);
      return;
    }
    if (!visible) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % 3), STEP_MS);
    return () => window.clearInterval(id);
  }, [visible, tick]);

  return (
    <article ref={ref} className={styles.chapter} data-in={seen ? "1" : "0"} style={{ "--i": index } as CSSProperties}>
      <div className={styles.chapterText}>
        <span className={styles.chapterEyebrow}>{chapter.eyebrow}</span>
        <h3>
          {chapter.title} <span>{chapter.accent}</span>
        </h3>
        <p>{chapter.text}</p>
        <ul className={styles.points}>
          {chapter.points.map((p) => (
            <li key={p}>
              <i aria-hidden="true">✓</i>
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.chapterVisual}>
        <div className={styles.mockStage} data-step={step} aria-hidden="true">
          <Mock step={step} />
        </div>
        <ol className={styles.steps} aria-label={`Pasos: ${chapter.title} ${chapter.accent}`}>
          {chapter.steps.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                className={styles.step}
                data-active={i === step ? "1" : "0"}
                aria-current={i === step ? "step" : undefined}
                onClick={() => {
                  setStep(i);
                  setTick((t) => t + 1);
                }}
              >
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepText}>{s}</span>
                <span className={styles.stepBar} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
};

/** "El sistema por dentro": los tres módulos que de verdad hace el sistema, cada uno con su minipantalla animada. */
export const LandingSystem = () => (
  <section className={[styles.section, styles.system].join(" ")} id="sistema" aria-labelledby="sistema-title">
    <div className={styles.sectionHead}>
      <span className={styles.eyebrow}>El sistema por dentro</span>
      <h2 id="sistema-title" className={styles.sectionTitle}>
        <SplitText text={"Llevar la tienda no debería\n*ser otro trabajo.*"} />
      </h2>
      <p className={styles.sectionLead}>
        Mi Tierrita SIG ordena la bodega, el mostrador y la cartera, y ayuda a decidir si conviene crecer. Así funciona, en tres pasos por módulo.
      </p>
    </div>
    <div className={styles.chapters}>
      {CHAPTERS.map((c, i) => (
        <ChapterRow key={c.code} chapter={c} index={i} />
      ))}
    </div>
    <p className={styles.mockNote}>Pantallas ilustrativas · cifras de ejemplo</p>
  </section>
);
