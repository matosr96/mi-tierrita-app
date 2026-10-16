import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/AppShell";
import styles from "./Landing.module.css";

const LINKS = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#sistema", label: "El sistema" },
  { href: "#visitenos", label: "Visítenos" },
  { href: "#proyecto", label: "Proyecto" },
  { href: "#contacto", label: "Contacto" },
];

/** Barra flotante en píldora: marca a la izquierda, secciones al centro y acceso al sistema; en móvil, un menú. */
export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={[styles.nav, scrolled ? styles.navScrolled : "", open ? styles.navOpen : ""].join(" ")}>
      <div className={styles.navBar}>
        <a href="#inicio" className={styles.navBrand} onClick={close}>
          <BrandMark size={30} />
          <span>
            <strong>Mi Tierrita</strong>
            <small>Agropecuaria</small>
          </span>
        </a>
        <nav id="landing-menu" className={styles.navLinks} aria-label="Secciones">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
          <Link to="/iniciar-sesion" className={styles.navMenuCta} onClick={close}>
            Ingresar al sistema
          </Link>
        </nav>
        <Link to="/iniciar-sesion" className={styles.navCta}>
          Ingresar al sistema
          <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className={styles.navToggle}
          aria-expanded={open}
          aria-controls="landing-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
};
