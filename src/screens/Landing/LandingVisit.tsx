import { Reveal, SplitText } from "./motion";
import { STORE } from "./content";
import styles from "./Landing.module.css";

/** Dónde queda la tienda. Solo muestra los datos confirmados en content.ts (los vacíos ocultan su bloque). */
export const LandingVisit = () => (
  <section className={styles.section} id="visitenos" aria-labelledby="visitenos-title">
    <div className={styles.visitGrid}>
      <div className={styles.visitText}>
        <span className={styles.eyebrow}>Visítenos</span>
        <h2 id="visitenos-title" className={styles.sectionTitle}>
          <SplitText text={"Sahagún,\n*Córdoba.*"} />
        </h2>
        <p className={styles.sectionLead}>Una tienda del campo cordobés que atiende a ganaderos, avicultores y agricultores de Sahagún y sus veredas.</p>
      </div>
      <Reveal variant="rise" delay={150}>
        <dl className={styles.visitCard}>
          <div>
            <dt>Dónde</dt>
            <dd>{STORE.address ? `${STORE.address} · ${STORE.city}` : `${STORE.city}, ${STORE.country}`}</dd>
          </div>
          {STORE.hours ? (
            <div>
              <dt>Horario</dt>
              <dd>{STORE.hours}</dd>
            </div>
          ) : null}
          {STORE.whatsapp ? (
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer">
                  +{STORE.whatsapp}
                </a>
              </dd>
            </div>
          ) : null}
          {STORE.email ? (
            <div>
              <dt>Correo</dt>
              <dd>
                <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Coordenadas</dt>
            <dd>8.95° N · 75.44° O</dd>
          </div>
          <div className={styles.visitPing} aria-hidden="true">
            <span />
          </div>
        </dl>
      </Reveal>
    </div>
  </section>
);
