import { useEffect } from "react";
import { LandingNav } from "./LandingNav";
import { LandingHero } from "./LandingHero";
import { LandingMarquee } from "./LandingMarquee";
import { LandingCatalog } from "./LandingCatalog";
import { LandingSystem } from "./LandingSystem";
import { LandingVisit } from "./LandingVisit";
import { LandingProject } from "./LandingProject";
import { LandingContact } from "./LandingContact";
import { LandingFooter } from "./LandingFooter";
import styles from "./Landing.module.css";

/** Página pública de Mi Tierrita (v4.1 rediseñada): para clientes de la tienda y para presentar el proyecto. */
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
    <div className={styles.page}>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingMarquee />
        <LandingCatalog />
        <LandingSystem />
        <LandingVisit />
        <LandingProject />
        <LandingContact />
      </main>
      <LandingFooter />
    </div>
  );
};
