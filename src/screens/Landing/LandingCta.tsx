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
        {/* Afina el borde del recorte: desenfoca solo la transparencia y la recorta apenas (quita el halo del fondo original), sin tocar la foto. */}
        <svg className={styles.ctaFilter} aria-hidden="true" focusable="false">
          <filter id="cta-feather" x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="soft" />
            <feComponentTransfer in="soft" result="edge">
              <feFuncA type="linear" slope="1.5" intercept="-0.4" />
            </feComponentTransfer>
            <feComposite in="SourceGraphic" in2="edge" operator="in" />
          </filter>
        </svg>
        <img className={styles.ctaPhoto} src="/media/manos-recorte.webp" alt="Manos que sostienen tierra" width={1440} height={1172} loading="lazy" decoding="async" />
      </div>
    </Reveal>
  </section>
);
