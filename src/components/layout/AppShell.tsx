import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import { useSignout } from "@/hooks/session";
import { NAV_GROUPS, NAV_ICONS, findRoute, isLockedFor, isVisibleFor } from "@/router/navigation";
import { initials } from "@/lib/format";
import { Toasts } from "@/components/ui";
import { useNavBadges } from "./useNavBadges";
import { NotificationsMenu } from "./NotificationsMenu";
import { CommandPalette } from "./CommandPalette";
import styles from "./AppShell.module.css";

/** Marca: hoja blanca sobre cuadrado verde. */
export const BrandMark = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="1.5" y="1.5" width="41" height="41" rx="11" fill="var(--sprout)" />
    <path d="M22 35 L22 18.5" stroke="var(--sprout-ink)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M22 26.5 C 16 26.5 12.5 22.5 12.5 16.5 C 18.5 16.5 22 20.5 22 26.5 Z" fill="var(--sprout-ink)" />
    <path d="M22 22.5 C 28 22.5 31.5 18.5 31.5 12.5 C 25.5 12.5 22 16.5 22 22.5 Z" fill="var(--sprout-ink)" opacity="0.7" />
  </svg>
);

const NavIcon = ({ paths }: { paths: string }) => <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />;

const Lock = () => (
  <svg className={styles.lock} width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="2.4" y="5.2" width="7.2" height="5.4" rx="1.2" stroke="currentColor" strokeWidth="1" />
    <path d="M4.2 5.2 V3.8 a1.8 1.8 0 0 1 3.6 0 V5.2" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

/** Secciones que van en la píldora central; el resto queda en "Más". Rótulos cortos para que quepan. */
const PRIMARY: Record<string, string> = {
  "/": "Inicio",
  "/inventario": "Inventario",
  "/lotes": "Lotes",
  "/ventas": "Ventas",
  "/clientes": "Clientes",
  "/finanzas": "Finanzas",
  "/reportes": "Reportes",
};

/**
 * Armazón de la app (estilo de las referencias Clerio / Pay Key): sin menú lateral. Barra superior con la marca, la
 * navegación en una píldora central con íconos (las secciones secundarias en "Más"), búsqueda, notificaciones y
 * usuario. En pantallas angostas la navegación completa se abre en un menú desplegable.
 */
export const AppShell = () => {
  const user = useSessionStore((s) => s.user);
  const signout = useSignout();
  const location = useLocation();
  const badges = useNavBadges();
  const fetching = useIsFetching();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const current = findRoute(location.pathname);
  const pageKey = current?.path ?? location.pathname;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setMoreOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // La cabecera alta (como en la referencia) se compacta al bajar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [moreOpen]);

  if (!user) return null;

  const visible = NAV_GROUPS.flatMap((g) => g.items.filter((i) => isVisibleFor(i, user.role)).map((i) => ({ ...i, group: g.title ?? "General" })));
  const primary = visible.filter((i) => PRIMARY[i.path]);
  const secondary = visible.filter((i) => !PRIMARY[i.path]);
  const secondaryActive = secondary.some((i) => location.pathname === i.path || location.pathname.startsWith(`${i.path}/`));
  const secondaryCount = secondary.reduce((n, i) => n + (i.badge ? (badges[i.badge] ?? 0) : 0), 0);

  const link = (item: (typeof visible)[number], variant: "pill" | "menu") => {
    const locked = isLockedFor(item, user.role);
    const count = item.badge ? badges[item.badge] : undefined;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        viewTransition
        end={item.path === "/"}
        title={item.label}
        aria-label={locked ? `${item.label} (acceso restringido)` : item.label}
        className={({ isActive }) => [variant === "pill" ? styles.tab : styles.menuItem, isActive ? styles.active : "", locked ? styles.locked : ""].join(" ")}
      >
        <NavIcon paths={item.icon} />
        <span className={variant === "pill" ? styles.tip : styles.label}>{variant === "pill" ? (PRIMARY[item.path] ?? item.label) : item.label}</span>
        {locked ? <Lock /> : count !== undefined && count > 0 ? <span className={styles.badge}>{count}</span> : null}
      </NavLink>
    );
  };

  return (
    <div className={styles.shell}>
      <div className={[styles.progress, fetching > 0 ? styles.progressOn : ""].join(" ")} aria-hidden="true" />
      <header className={[styles.topbar, scrolled ? styles.compact : ""].join(" ")}>
        <Link to="/" className={styles.brand} aria-label="Mi Tierrita, inicio">
          <BrandMark />
          <span className={styles.brandText}>
            <span className={styles.brandName}>Mi Tierrita</span>
            <span className={styles.brandSub}>Agropecuaria</span>
          </span>
        </Link>

        <nav className={styles.pill} aria-label="Menú principal">
          {primary.map((item) => link(item, "pill"))}
          {secondary.length > 0 ? (
            <div ref={moreRef} className={styles.moreWrap}>
              <button
                type="button"
                className={[styles.tab, secondaryActive ? styles.active : ""].join(" ")}
                aria-expanded={moreOpen}
                aria-label="Más secciones"
                title="Más secciones"
                aria-haspopup="menu"
                onClick={() => setMoreOpen((v) => !v)}
              >
                <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true">
                  <circle cx="5.5" cy="11" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="16.5" cy="11" r="1.4" fill="currentColor" stroke="none" />
                </svg>
                <span className={styles.tip}>Más</span>
                {secondaryCount > 0 ? <span className={styles.badge}>{secondaryCount}</span> : null}
              </button>
              {moreOpen ? (
                <div className={styles.dropdown}>
                  {secondary.map((item) => link(item, "menu"))}
                  <span className={styles.sep} aria-hidden="true" />
                  <button type="button" className={styles.menuItem} onClick={() => signout.mutate(undefined)}>
                    <NavIcon paths={NAV_ICONS.signout} />
                    <span className={styles.label}>Cerrar sesión</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className={styles.tools}>
          <button type="button" className={styles.iconBtn} onClick={() => setPaletteOpen(true)} aria-label="Buscar un módulo (Ctrl+K)" title="Buscar (Ctrl+K)">
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <NotificationsMenu />
          <Link to="/perfil" className={styles.user} title={`${user.firstName} ${user.lastName} · ${ROLE_LABELS[user.role]}`}>
            <span className={styles.avatar}>{initials(user.firstName, user.lastName)}</span>
          </Link>
          <button type="button" className={[styles.iconBtn, styles.menuBtn].join(" ")} aria-expanded={menuOpen} aria-label="Abrir el menú" onClick={() => setMenuOpen((v) => !v)}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Menú completo para pantallas angostas. */}
      {menuOpen ? (
        <>
          <div className={styles.scrim} onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <nav className={styles.sheet} aria-label="Menú">
            {NAV_GROUPS.map((g) => {
              const items = visible.filter((i) => i.group === (g.title ?? "General"));
              if (items.length === 0) return null;
              return (
                <div key={g.title ?? "General"} className={styles.sheetGroup}>
                  {g.title ? <span className={styles.sheetTitle}>{g.title}</span> : null}
                  {items.map((item) => link(item, "menu"))}
                </div>
              );
            })}
            <button type="button" className={styles.menuItem} onClick={() => signout.mutate(undefined)}>
              <NavIcon paths={NAV_ICONS.signout} />
              <span className={styles.label}>Cerrar sesión</span>
            </button>
          </nav>
        </>
      ) : null}

      <main className={styles.content} key={pageKey}>
        <Outlet />
      </main>
      <Toasts />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={user.role} />
    </div>
  );
};

/** Encabezado de página: título grande y liviano sobre el degradado, subtítulo y acciones en píldora. */
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div className={styles.pageHead}>
    <div className={styles.pageHeadText}>
      <h1 className={styles.pageTitle}>{title.replace(/\*/g, "")}</h1>
      {subtitle ? <p className={styles.pageSub}>{subtitle}</p> : null}
    </div>
    {actions ? <div className={styles.pageActions}>{actions}</div> : null}
  </div>
);
