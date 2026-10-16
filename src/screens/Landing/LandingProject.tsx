import { Reveal, SplitText } from "@/components/motion";
import { ACADEMIC, ADVISORS, TEAM } from "./content";
import styles from "./Landing.module.css";

/** Origen del sistema: un trabajo de grado de Ingeniería de Software de la Universidad de Cartagena. */
export const LandingProject = () => (
  <section className={[styles.section, styles.project].join(" ")} id="proyecto" aria-labelledby="proyecto-title">
    <div className={styles.projectGrid}>
      <div className={styles.projectText}>
        <span className={styles.eyebrow}>
          <span>04</span>El proyecto
        </span>
        <h2 id="proyecto-title" className={styles.sectionTitle}>
          <SplitText text={"Un trabajo de grado de\n*Ingeniería de Software.*"} />
        </h2>
        <p className={styles.sectionLead}>
          Mi Tierrita SIG nació como trabajo de grado del programa de Ingeniería de Software de la Universidad de Cartagena, en los cursos de Sistemas de
          Información Gerencial e Ingeniería Económica: un sistema hecho a la medida de una agropecuaria real para operar el día a día, entender el
          negocio y evaluar si conviene ampliar el local.
        </p>
        <div className={styles.people}>
          <div>
            <span className={styles.peopleLabel}>Equipo</span>
            <ul>
              {TEAM.map((p, i) => (
                <Reveal key={p.name} delay={i * 90} variant="rise">
                  <li className={styles.person}>
                    <span className={styles.personMono}>{p.initials}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.role}</small>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
          <div>
            <span className={styles.peopleLabel}>Docentes</span>
            <ul>
              {ADVISORS.map((a, i) => (
                <Reveal key={a.name} delay={i * 90 + 200} variant="rise">
                  <li className={styles.person}>
                    <span className={[styles.personMono, styles.personMonoAlt].join(" ")}>{a.initials}</span>
                    <span>
                      <strong>{a.name}</strong>
                      <small>{a.course}</small>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Reveal variant="scale" delay={200}>
        <figure className={styles.seal}>
          <img src="/media/universidad-de-cartagena.jpg" alt="Universidad de Cartagena, fundada en 1827" width={1153} height={556} loading="lazy" />
          <figcaption>
            <span>Programa</span>
            <strong>Ingeniería de Software</strong>
            <span>{ACADEMIC}</span>
          </figcaption>
        </figure>
      </Reveal>
    </div>
  </section>
);
