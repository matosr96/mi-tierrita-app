import { Reveal, SplitText } from "./motion";
import { ACADEMIC, TEAM, WORK_KIND } from "./content";
import styles from "./Landing.module.css";

/** Origen del sistema: un Trabajo Colaborativo Contextualizado de Ingeniería de Software de la Universidad de Cartagena. */
export const LandingProject = () => (
  <section className={styles.section} id="proyecto" aria-labelledby="proyecto-title">
    <div className={styles.sectionHead}>
      <span className={styles.eyebrow}>El proyecto</span>
      <h2 id="proyecto-title" className={styles.sectionTitle}>
        <SplitText text={"Un trabajo colaborativo de\n*Ingeniería de Software.*"} />
      </h2>
      <p className={styles.sectionLead}>
        Mi Tierrita SIG nació como {WORK_KIND} del programa de Ingeniería de Software de la Universidad de Cartagena: un sistema hecho a la medida de
        una agropecuaria real para operar el día a día, entender el negocio y evaluar si conviene ampliar el local.
      </p>
    </div>
    <div className={styles.projectGrid}>
      <Reveal variant="scale">
        <figure className={styles.seal}>
          <img src="/media/universidad-de-cartagena.jpg" alt="Universidad de Cartagena, fundada en 1827" width={1153} height={556} loading="lazy" />
          <figcaption>
            <span>{WORK_KIND}</span>
            <strong>Ingeniería de Software</strong>
            <span>{ACADEMIC}</span>
          </figcaption>
        </figure>
      </Reveal>
      <Reveal variant="rise" delay={140}>
        <div className={styles.teamCard}>
          <span className={styles.teamLabel}>Equipo</span>
          <ul>
            {TEAM.map((p) => (
              <li key={p.name} className={styles.person}>
                <span className={styles.personMono}>{p.initials}</span>
                <strong>{p.name}</strong>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  </section>
);
