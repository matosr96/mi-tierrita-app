import { Link } from "react-router-dom";
import { Reveal, SplitText } from "./motion";
import styles from "./Landing.module.css";

/** Banda de cierre: panel verde pastel con titular, dos acciones y la foto real de las manos con tierra. */
export const LandingCta = () => (
  <section className={styles.ctaWrap} aria-labelledby="cta-title">
    <Reveal variant="scale">
      <div className={styles.cta}>
        <div className={styles.ctaText}>
          <h2 id="cta-title" className={styles.ctaTitle}>
            <SplitText text={"Del campo cordobés,\n*con la información al día.*"} />
          </h2>
          <p>Pase por la tienda o escríbanos su pedido. Si es parte del equipo, entre al sistema con su usuario.</p>
          <div className={styles.ctaActions}>
            <a href="#contacto" className={styles.btnPrimary}>
              Escríbanos
              <span aria-hidden="true">→</span>
            </a>
            <Link to="/iniciar-sesion" className={styles.btnGhost}>
              Ingresar al sistema
            </Link>
          </div>
        </div>
        <img className={styles.ctaPhoto} src="/media/manos-recorte.webp" alt="Manos que sostienen tierra" width={1440} height={1173} loading="lazy" decoding="async" />
      </div>
    </Reveal>
  </section>
);
