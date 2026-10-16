import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/AppShell";
import { ACADEMIC, LINES, WORK_KIND } from "./content";
import styles from "./Landing.module.css";

/** Pie: marca, secciones, líneas, acceso al sistema y crédito académico. */
export const LandingFooter = () => (
  <footer className={styles.footer}>
    <div className={styles.footerTop}>
      <div className={styles.footerBrand}>
        <BrandMark size={40} />
        <p>
          Información que <em>siembra decisiones.</em>
        </p>
      </div>
      <nav aria-label="Secciones">
        <span>Secciones</span>
        <a href="#catalogo">Catálogo</a>
        <a href="#sistema">El sistema</a>
        <a href="#visitenos">Visítenos</a>
        <a href="#proyecto">Proyecto</a>
        <a href="#contacto">Contacto</a>
      </nav>
      <nav aria-label="Líneas de producto">
        <span>Líneas</span>
        {LINES.map((l) => (
          <a key={l.code} href="#catalogo">
            {l.name} {l.accent}
          </a>
        ))}
      </nav>
      <div className={styles.footerAccess}>
        <span>Personal de la tienda</span>
        <Link to="/iniciar-sesion" className={styles.btnPrimary}>
          Ingresar al sistema <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
    <div className={styles.footerWord} aria-hidden="true">
      Mi Tierrita
    </div>
    <div className={styles.footerBottom}>
      <span>© {new Date().getFullYear()} Agropecuaria Mi Tierrita · Sahagún, Córdoba</span>
      <span>Fotografías: Gabriel Jimenez y archivo de Unsplash (licencia Unsplash)</span>
      <span className={styles.footerUni}>
        <img src="/media/universidad-de-cartagena.jpg" alt="" width={72} height={35} loading="lazy" />
        {WORK_KIND} · Ingeniería de Software · {ACADEMIC.split(" · ")[0]}
      </span>
    </div>
  </footer>
);
