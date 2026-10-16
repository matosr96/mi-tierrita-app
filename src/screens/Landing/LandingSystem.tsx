import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SplitText } from "@/components/motion";
import { CHAPTERS } from "./content";
import styles from "./Landing.module.css";

/** Límites de cada capítulo en el avance del scroll (coinciden con el guion de storyScene). */
const BOUNDS = [0, 0.345, 0.685, 1];
/** Momento (paso 1, 2 o 3) dentro de cada capítulo. */
const STEP_AT = [
  [0.13, 0.23],
  [0.45, 0.555],
  [0.77, 0.87],
];
const stepIndex = (p: number, chapter: number) => {
  const [a, b] = STEP_AT[chapter]!;
  return p < a! ? 0 : p < b! ? 1 : 2;
};

/** Texto y tono de las etiquetas que flotan sobre la escena. */
const LABEL_TEXT: Record<string, { text: string; tone: "plain" | "warn" | "good" | "bad" | "hot" }> = {
  compra: { text: "Compra nueva · cada lote con su vencimiento", tone: "plain" },
  antes: { text: "Vence antes", tone: "warn" },
  despues: { text: "Vence después", tone: "good" },
  sale: { text: "Sale primero · FEFO", tone: "hot" },
  factura: { text: "Factura de la venta", tone: "plain" },
  saldo: { text: "Saldo del cliente · dentro del cupo", tone: "warn" },
  abono: { text: "Abono · el saldo baja", tone: "good" },
  cero: { text: "VPN = 0", tone: "hot" },
  negativo: { text: "No conviene · VPN negativo", tone: "bad" },
  conviene: { text: "Conviene", tone: "hot" },
};
const chapterIndex = (p: number) => (p < BOUNDS[1]! ? 0 : p < BOUNDS[2]! ? 1 : 2);
const within = (p: number, i: number) => Math.min(Math.max((p - BOUNDS[i]!) / (BOUNDS[i + 1]! - BOUNDS[i]!), 0), 1);

const LEGENDS = [
  [
    ["lgBad", "Vencido"],
    ["lgWarn", "Por vencer"],
    ["lgOk", "Al día"],
  ],
  [
    ["lgOk", "Contado"],
    ["lgWarn", "Crédito"],
  ],
  [["lgOk", "Escenario que conviene"]],
] as const;

/**
 * "El sistema por dentro": la escena 3D queda fija mientras se hace scroll. Los capítulos se relevan en un escenario
 * de altura fija (el que sale sube y se desenfoca, el que entra llega desde abajo) y un riel marca el avance.
 */
export const LandingSystem = () => {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [active, setActive] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let disposed = false;
    let scene: { setProgress: (p: number) => void; destroy: () => void } | null = null;
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(Math.max(-r.top / (r.height - window.innerHeight), 0), 1);
      scene?.setProgress(p);
      const ch = chapterIndex(p);
      setActive(ch);
      setStep(stepIndex(p, ch));
      // El relleno del riel se actualiza sin re-renderizar.
      railRef.current?.querySelectorAll<HTMLElement>("[data-fill]").forEach((fill, i) => fill.style.setProperty("--fill", String(within(p, i))));
    };
    void import("./storyScene").then(({ createStoryScene }) => {
      if (disposed || !canvasRef.current) return;
      scene = createStoryScene(canvasRef.current, (labels) => {
        for (const l of labels) {
          const el = labelRefs.current[l.id];
          if (!el) continue;
          // La etiqueta no se sale del lienzo aunque su ancla quede en el borde.
          el.dataset.w ??= String(el.offsetWidth);
          const half = Number(el.dataset.w) / 2;
          const w = el.parentElement?.clientWidth ?? 0;
          const x = w > half * 2 + 16 ? Math.min(Math.max(l.x, half + 8), w - half - 8) : l.x;
          el.style.transform = `translate3d(${x}px, ${l.y}px, 0)`;
          el.dataset.on = l.visible ? "1" : "0";
        }
      });
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

  return (
    <section ref={ref} className={styles.system} id="sistema" aria-labelledby="sistema-title">
      <div className={styles.systemSticky}>
        <canvas ref={canvasRef} className={styles.systemCanvas} aria-hidden="true" />
        <div className={styles.storyLabels} aria-hidden="true">
          {Object.entries(LABEL_TEXT).map(([id, l]) => (
            <span key={id} ref={(el) => void (labelRefs.current[id] = el)} className={[styles.storyLabel, styles[`tone_${l.tone}`]].join(" ")} data-on="0">
              <i />
              {l.text}
            </span>
          ))}
        </div>
        <div className={styles.systemText}>
          <span className={styles.eyebrow}>
            <span>02</span>El sistema por dentro
          </span>
          <h2 id="sistema-title" className={styles.systemTitle}>
            <SplitText text={"Leer el negocio,\n*decidir si crecer.*"} />
          </h2>

          <ol ref={railRef} className={styles.rail} aria-label="Capítulos">
            {CHAPTERS.map((c, i) => (
              <li key={c.code} className={i === active ? styles.railOn : i < active ? styles.railDone : ""}>
                <span className={styles.railCode}>{c.code}</span>
                <span className={styles.railLabel}>{c.eyebrow}</span>
                <span className={styles.railTrack}>
                  <span data-fill style={{ "--fill": 0 } as CSSProperties} />
                </span>
              </li>
            ))}
          </ol>

          <div className={styles.stage} aria-live="polite">
            {CHAPTERS.map((c, i) => (
              <article
                key={c.code}
                className={[styles.scene, i === active ? styles.sceneOn : i < active ? styles.scenePast : styles.sceneNext].join(" ")}
                aria-hidden={i !== active}
              >
                <h3>
                  {c.title} <em>{c.accent}</em>
                </h3>
                <div className={styles.nowStep}>
                  <span className={styles.nowStepNum}>Paso {(i === active ? step : 0) + 1} de 3</span>
                  <span key={i === active ? step : 0} className={styles.nowStepText}>
                    {c.steps[i === active ? step : 0]}
                  </span>
                </div>
                <p>{c.text}</p>
                <ul>
                  {c.points.map((pt, k) => (
                    <li key={pt} style={{ "--k": k } as CSSProperties}>
                      {pt}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.systemLegend} aria-hidden="true">
          <span className={styles.legendStep}>
            {String(active + 1).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
          </span>
          {LEGENDS[active]!.map(([cls, label]) => (
            <span key={label} className={styles.legendItem}>
              <i className={styles[cls]} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
