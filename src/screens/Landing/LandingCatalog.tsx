import type { CSSProperties, PointerEvent } from "react";
import { Reveal, SplitText } from "@/components/motion";
import { LINES } from "./content";
import { LineArt } from "./LineArt";
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
          <article className={styles.lineCard} onPointerMove={tilt} onPointerLeave={untilt} style={{ "--i": i } as CSSProperties}>
            <LineArt code={line.code} />
            <div className={styles.lineShade} aria-hidden="true" />
            <span className={styles.lineCode}>L-{line.code}</span>
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
        </Reveal>
      ))}
    </div>
  </section>
);
