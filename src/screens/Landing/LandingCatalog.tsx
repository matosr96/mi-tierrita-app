import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Reveal, SplitText } from "@/components/motion";
import { LINES, type ProductLine } from "./content";
import { LineStory } from "./LineStory";
import styles from "./Landing.module.css";

/** Inclina la tarjeta hacia el cursor y mueve el brillo con él. */
const tilt = (e: PointerEvent<HTMLElement>) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width;
  const py = (e.clientY - r.top) / r.height;
  el.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
  el.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
  el.style.setProperty("--mx", `${px * 100}%`);
  el.style.setProperty("--my", `${py * 100}%`);
};
const untilt = (e: PointerEvent<HTMLElement>) => {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
};

/**
 * Tarjeta de una línea: en reposo muestra la foto; activa (cursor encima, foco, o en pantallas táctiles cuando llega
 * al centro) la foto se desenfoca y la escena dibuja en tres pasos para qué sirve. Cada activación la reinicia.
 */
const LineCard = ({ line, index }: { line: ProductLine; index: number }) => {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [run, setRun] = useState(0);
  const activate = (on: boolean) =>
    setActive((was) => {
      if (on && !was) setRun((n) => n + 1);
      return on;
    });

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: hover)").matches || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => activate(Boolean(entry?.isIntersecting)), { rootMargin: "-38% 0px -38% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article
      ref={ref}
      className={styles.lineCard}
      data-active={active ? "1" : "0"}
      tabIndex={0}
      onPointerEnter={(e) => e.pointerType === "mouse" && activate(true)}
      onPointerMove={tilt}
      onPointerLeave={(e) => {
        untilt(e);
        if (e.pointerType === "mouse") activate(false);
      }}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      style={{ "--i": index } as CSSProperties}
    >
      <img className={styles.linePhoto} src={`/media/catalogo/${line.code}.webp`} alt="" loading="lazy" decoding="async" />
      <div className={styles.lineShade} aria-hidden="true" />
      <div className={styles.lineLens}>
        <LineStory key={run} code={line.code} active={active} />
      </div>
      <span className={styles.lineCode}>L-{line.code}</span>
      <span className={styles.lineHint} aria-hidden="true">
        Para qué sirve
      </span>
      <div className={styles.lineBody}>
        <h3>
          {line.name} <em>{line.accent}</em>
        </h3>
        <p>{line.text}</p>
        <ul>
          {line.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </article>
  );
};

/** Catálogo por líneas: lo primero que busca un cliente. */
export const LandingCatalog = () => (
  <section className={styles.section} id="catalogo" aria-labelledby="catalogo-title">
    <div className={styles.sectionHead}>
      <span className={styles.eyebrow}>
        <span>01</span>Lo que encuentra en la tienda
      </span>
      <h2 id="catalogo-title" className={styles.sectionTitle}>
        <SplitText text={"Catálogo por *líneas.*"} />
      </h2>
      <p className={styles.sectionLead}>Seis líneas para la finca, el corral y el cultivo. Pregunte en el mostrador por marcas y presentaciones.</p>
    </div>
    <div className={styles.lines}>
      {LINES.map((line, i) => (
        <Reveal key={line.code} delay={i * 80} variant="rise">
          <LineCard line={line} index={i} />
        </Reveal>
      ))}
    </div>
  </section>
);
