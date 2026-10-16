import { useEffect } from "react";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingCatalog } from "./LandingCatalog";
import { LandingSystem } from "./LandingSystem";
import { LandingTita } from "./LandingTita";
import { LandingVisit } from "./LandingVisit";
import { LandingProject } from "./LandingProject";
import { LandingContact } from "./LandingContact";
import { LandingCta } from "./LandingCta";
import { LandingFooter } from "./LandingFooter";
import styles from "./Landing.module.css";

/** Página pública de Mi Tierrita: tema blanco con animaciones, para clientes de la tienda y para presentar el proyecto. */
export const LandingScreen = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = "Mi Tierrita · Agropecuaria en Sahagún, Córdoba";
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.title = prev;
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    // data-motion: la página pública conserva sus animaciones (global.css las apaga en el resto de la app).
    <div className={styles.page} data-motion>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingCatalog />
        <LandingSystem />
        <LandingTita />
        <LandingVisit />
        <LandingProject />
        <LandingContact />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
};
