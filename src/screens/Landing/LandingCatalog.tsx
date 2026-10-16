import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Reveal, SplitText } from "./motion";
import { LINES, type ProductLine } from "./content";
import { LineStory } from "./LineStory";
import styles from "./Landing.module.css";

/**
 * Tarjeta blanca de una línea: foto real arriba y texto abajo. Activa (cursor encima, foco, o en pantallas táctiles
 * cuando llega al centro) la foto se cubre de blanco y una escena SVG cuenta en tres pasos para qué sirve.
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
      onPointerLeave={(e) => e.pointerType === "mouse" && activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
      style={{ "--i": index } as CSSProperties}
    >
      <div className={styles.lineMedia}>
        <img className={styles.linePhoto} src={`/media/catalogo/${line.code}.webp`} alt="" width={1200} height={1601} loading="lazy" decoding="async" />
        <div className={styles.lineLens}>
          <LineStory key={run} code={line.code} active={active} />
        </div>
        <span className={styles.lineCode}>L-{line.code}</span>
        <span className={styles.lineHint} aria-hidden="true">
          Para qué sirve
        </span>
      </div>
      <div className={styles.lineBody}>
        <h3>
          {line.name} <span>{line.accent}</span>
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
      <span className={styles.eyebrow}>Lo que encuentra en la tienda</span>
      <h2 id="catalogo-title" className={styles.sectionTitle}>
        <SplitText text={"Todo para la finca,\n*catálogo por líneas.*"} />
      </h2>
      <p className={styles.sectionLead}>Seis líneas para la finca, el corral y el cultivo. Pregunte en el mostrador por marcas y presentaciones.</p>
    </div>
    <div className={styles.lines}>
      {LINES.map((line, i) => (
        <Reveal key={line.code} delay={(i % 3) * 90} variant="rise">
          <LineCard line={line} index={i} />
        </Reveal>
      ))}
    </div>
  </section>
);
