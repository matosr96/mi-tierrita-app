import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import { useUiStore } from "@/stores/ui";
import { useThemeStore } from "@/stores/theme";
import { useSignout } from "@/hooks/session";
import { ALL_NAV_ITEMS, NAV_GROUPS, NAV_ICONS, findRoute, isLockedFor, isVisibleFor } from "@/router/navigation";
import { initials } from "@/lib/format";
import { Toasts } from "@/components/ui";
import { SplitText, TopoField } from "@/components/motion";
import { useNavBadges } from "./useNavBadges";
import { CommandPalette } from "./CommandPalette";
import styles from "./AppShell.module.css";

/** Marca: hoja sobre cuadrado lima. */
export const BrandMark = ({ size = 38 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="1.5" y="1.5" width="41" height="41" rx="13.5" fill="var(--sprout)" />
    <path d="M22 35 L22 18.5" stroke="var(--sprout-ink)" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M22 26.5 C 16 26.5 12.5 22.5 12.5 16.5 C 18.5 16.5 22 20.5 22 26.5 Z" fill="var(--sprout-ink)" />
    <path d="M22 22.5 C 28 22.5 31.5 18.5 31.5 12.5 C 25.5 12.5 22 16.5 22 22.5 Z" fill="var(--leaf)" />
  </svg>
);

const NavIcon = ({ paths }: { paths: string }) => <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />;

const Lock = () => (
  <svg className={styles.lock} width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="2.4" y="5.2" width="7.2" height="5.4" rx="1.2" stroke="currentColor" strokeWidth="1" />
    <path d="M4.2 5.2 V3.8 a1.8 1.8 0 0 1 3.6 0 V5.2" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

const Chevron = () => (
  <svg className={styles.chevron} width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3.5 L10.5 8 L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const timeNow = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** Barra lateral, barra superior de vidrio y panel de contenido con transición entre pantallas. */
export const AppShell = () => {
  const user = useSessionStore((s) => s.user);
  const navOpen = useUiStore((s) => s.navOpen);
  const toggleNav = useUiStore((s) => s.toggleNav);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const signout = useSignout();
  const location = useLocation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const fetching = useIsFetching();
  const [savedAt, setSavedAt] = useState(timeNow);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const current = findRoute(location.pathname);
  const pageKey = current?.path ?? location.pathname;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // El tema oscuro solo se activa con data-theme="dark"; "system" se ve claro.
  const dark = themeMode === "dark";

  useEffect(() => {
    if (fetching === 0) setSavedAt(timeNow());
  }, [fetching]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  // El indicador del menú se desliza hasta el elemento activo.
  const measure = useCallback(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setIndicator(active ? { top: active.offsetTop, height: active.offsetHeight } : null);
  }, []);
  useLayoutEffect(measure, [measure, location.pathname, navOpen, user?.role]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  if (!user) return null;
  const attention = (badges.inventory ?? 0) + (badges.batches ?? 0) + (badges.customers ?? 0) > 0;
  let order = 0;

  return (
    <div className={styles.shell}>
      <div className={[styles.progress, fetching > 0 ? styles.progressOn : ""].join(" ")} aria-hidden="true" />
      <nav className={[styles.nav, navOpen ? "" : styles.rail, mobileOpen ? styles.navMobileOpen : ""].join(" ")} aria-label="Menú principal">
        <div className={styles.brand}>
          <BrandMark />
          <div className={styles.brandText}>
            <div className={styles.brandName}>Mi Tierrita</div>
            <div className={styles.brandSub}>Agropecuaria</div>
          </div>
        </div>
        <div className={styles.list} ref={listRef}>
          {indicator ? <span className={styles.indicator} style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }} aria-hidden="true" /> : null}
          {NAV_GROUPS.map((group, gi) => {
            const items = group.items.filter((i) => isVisibleFor(i, user.role));
            if (items.length === 0) return null;
            return (
              <div key={group.title ?? "main"} style={{ display: "contents" }}>
                {group.title ? (
                  <div className={styles.cat}>
                    <span>{String(gi).padStart(2, "0")}</span>
                    {group.title}
                  </div>
                ) : null}
                {items.map((item) => {
                  const locked = isLockedFor(item, user.role);
                  const count = item.badge ? badges[item.badge] : undefined;
                  order += 1;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      viewTransition
                      end={item.path === "/"}
                      aria-label={item.label}
                      title={navOpen ? undefined : item.label}
                      style={{ "--i": order } as CSSProperties}
                      className={({ isActive }) => [styles.item, isActive ? styles.active : "", locked ? styles.locked : ""].join(" ")}
                    >
                      <NavIcon paths={item.icon} />
                      <span className={styles.label}>{item.label}</span>
                      {locked ? <Lock /> : count !== undefined && count > 0 ? <span className={styles.badge}>{count}</span> : null}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className={styles.exitWrap}>
          <button type="button" className={[styles.item, styles.exit].join(" ")} onClick={() => signout.mutate(undefined)} aria-label="Cerrar sesión" title="Cerrar sesión">
            <NavIcon paths={NAV_ICONS.signout} />
            <span className={styles.label}>Cerrar sesión</span>
          </button>
        </div>
      </nav>
      {mobileOpen ? <div className={styles.scrim} onClick={() => setMobileOpen(false)} aria-hidden="true" /> : null}

      <div className={styles.panel}>
        <header className={[styles.topbar, scrolled ? styles.scrolled : ""].join(" ")}>
          <button
            type="button"
            className={[styles.iconBtn, styles.toggle].join(" ")}
            onClick={() => (window.innerWidth <= 900 ? setMobileOpen((v) => !v) : toggleNav())}
            aria-label={navOpen ? "Ocultar el menú lateral" : "Mostrar el menú lateral"}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2.5" y="3.5" width="17" height="15" rx="2.6" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8.6" y1="3.5" x2="8.6" y2="18.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <nav className={styles.crumbs} aria-label="Ruta de navegación">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Mi Tierrita</a>
            <Chevron />
            <strong aria-current="page" key={current?.path ?? "/"}>
              {current?.label ?? "Inicio"}
            </strong>
            <span id="crumb-slot" style={{ display: "contents" }} />
          </nav>
          <button type="button" className={styles.search} onClick={() => setPaletteOpen(true)} aria-label="Ir a un módulo (Ctrl+K)">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5 L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className={styles.searchText}>Ir a…</span>
            <kbd className={styles.kbd}>⌘K</kbd>
          </button>
          <span className={[styles.saved, fetching > 0 ? styles.savedBusy : ""].join(" ")}>
            <span className={styles.pulse} aria-hidden="true" />
            {fetching > 0 ? "Sincronizando" : `En línea · ${savedAt}`}
          </span>
          <button type="button" className={styles.iconBtn} aria-label={dark ? "Usar tema claro" : "Usar tema oscuro"} title={dark ? "Tema claro" : "Tema oscuro"} onClick={() => setThemeMode(dark ? "light" : "dark")}>
            <svg className={styles.themeIcon} width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {dark ? (
                <>
                  <circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              )}
            </svg>
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Notificaciones" onClick={() => navigate("/")}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2.5 a4.8 4.8 0 0 1 4.8 4.8 v3.2 l1.4 2.4 h-12.4 l1.4 -2.4 v-3.2 A4.8 4.8 0 0 1 10 2.5 z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8.2 15.6 a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {attention ? <span className={styles.dot} /> : null}
          </button>
          <span className={styles.readProgress} aria-hidden="true" />
          <div className={styles.user}>
            <div className={styles.avatar}>{initials(user.firstName, user.lastName)}</div>
            <div>
              <div className={styles.userName}>
                {user.firstName} {user.lastName}
              </div>
              <div className={styles.userRole}>{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
        </header>
        <main className={styles.content} key={pageKey} ref={mainRef}>
          <Outlet />
        </main>
      </div>
      <Toasts />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} role={user.role} />
    </div>
  );
};

/** "Lotes y vencimientos" → "Lotes y *vencimientos*": la última palabra va en serif cursiva (si el título no trae ya un acento). */
const accentTitle = (title: string): string => {
  if (title.includes("*")) return title;
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return title;
  return `${words.slice(0, -1).join(" ")} *${words[words.length - 1]}*`;
};

/** Encabezado de página: banda oscura con curvas de nivel propias de la sección, titular y acciones. */
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => {
  const location = useLocation();
  const route = findRoute(location.pathname);
  const index = route ? ALL_NAV_ITEMS.indexOf(route) + 1 : 0;
  const today = new Date().toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div className={styles.pageHead}>
      <TopoField className={styles.bandTopo} rings={12} signal={(index * 5) % 12} seed={index * 1.37} />
      <div className={styles.bandGlow} aria-hidden="true" />
      <div className={styles.bandTop}>
        <div className={styles.eyebrow}>
          <span>{String(index).padStart(2, "0")}</span>
          <span className={styles.eyebrowRule} />
          {route?.label ?? "Mi Tierrita"}
        </div>
        <span className={styles.bandDate}>Mi Tierrita · {today}</span>
      </div>
      <div className={styles.bandBody}>
        <div className={styles.pageHeadText}>
          <h1 className={styles.pageTitle}>
            <SplitText key={title} text={accentTitle(title)} />
          </h1>
          {subtitle ? <div className={styles.pageSub}>{subtitle}</div> : null}
        </div>
        {actions ? <div className={styles.pageActions}>{actions}</div> : null}
      </div>
    </div>
  );
};
