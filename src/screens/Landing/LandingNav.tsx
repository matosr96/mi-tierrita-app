import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/AppShell";
import styles from "./Landing.module.css";

const LINKS = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#sistema", label: "El sistema" },
  { href: "#visitenos", label: "Visítenos" },
  { href: "#proyecto", label: "Proyecto" },
];

/** Barra de navegación de la página pública: se vuelve de vidrio al bajar y se recoge en móvil. */
export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={[styles.nav, scrolled ? styles.navScrolled : "", open ? styles.navOpen : ""].join(" ")}>
      <a href="#inicio" className={styles.navBrand} onClick={() => setOpen(false)}>
        <BrandMark size={32} />
        <span>
          <strong>Mi Tierrita</strong>
          <small>Agropecuaria · Sahagún</small>
        </span>
      </a>
      <nav className={styles.navLinks} aria-label="Secciones">
        {LINKS.map((l, i) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {l.label}
          </a>
        ))}
      </nav>
      <Link to="/iniciar-sesion" className={styles.navCta}>
        Ingresar al sistema
        <span aria-hidden="true">→</span>
      </Link>
      <button type="button" className={styles.navToggle} aria-expanded={open} aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen((v) => !v)}>
        <span />
        <span />
      </button>
    </header>
  );
};
