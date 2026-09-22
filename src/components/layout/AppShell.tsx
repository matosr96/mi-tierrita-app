import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import { useUiStore } from "@/stores/ui";
import { useSignout } from "@/hooks/session";
import { NAV_GROUPS, NAV_ICONS, findRoute, isLockedFor, isVisibleFor } from "@/router/navigation";
import { initials } from "@/lib/format";
import { Toasts } from "@/components/ui";
import { useNavBadges } from "./useNavBadges";
import styles from "./AppShell.module.css";

/** Marca del lienzo: hoja sobre cuadrado verde claro. */
export const BrandMark = ({ size = 38 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <rect x="1.5" y="1.5" width="41" height="41" rx="13.5" fill="#95D5B2" />
    <path d="M22 35 L22 18.5" stroke="#132E24" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M22 26.5 C 16 26.5 12.5 22.5 12.5 16.5 C 18.5 16.5 22 20.5 22 26.5 Z" fill="#132E24" />
    <path d="M22 22.5 C 28 22.5 31.5 18.5 31.5 12.5 C 25.5 12.5 22 16.5 22 22.5 Z" fill="#2D6A4F" />
  </svg>
);

const NavIcon = ({ paths }: { paths: string }) => <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths }} />;

const Lock = () => (
  <svg className={styles.lock} width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="2.4" y="5.2" width="7.2" height="5.4" rx="1.2" fill="#132E24" stroke="#5C7D6B" strokeWidth="1" />
    <path d="M4.2 5.2 V3.8 a1.8 1.8 0 0 1 3.6 0 V5.2" stroke="#5C7D6B" strokeWidth="1.1" />
  </svg>
);

const Chevron = () => (
  <svg className={styles.chevron} width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 3.5 L10.5 8 L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const timeNow = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** Barra lateral, barra superior y panel de contenido, fieles al lienzo de diseño. */
export const AppShell = () => {
  const user = useSessionStore((s) => s.user);
  const navOpen = useUiStore((s) => s.navOpen);
  const toggleNav = useUiStore((s) => s.toggleNav);
  const signout = useSignout();
  const location = useLocation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const fetching = useIsFetching();
  const [savedAt, setSavedAt] = useState(timeNow);
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = findRoute(location.pathname);

  useEffect(() => {
    if (fetching === 0) setSavedAt(timeNow());
  }, [fetching]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!user) return null;
  const attention = (badges.inventory ?? 0) + (badges.batches ?? 0) + (badges.customers ?? 0) > 0;

  return (
    <div className={styles.shell}>
      <nav className={[styles.nav, navOpen ? "" : styles.rail, mobileOpen ? styles.navMobileOpen : ""].join(" ")} aria-label="Menú principal">
        <div className={styles.brand}>
          <BrandMark />
          <div className={styles.brandText}>
            <div className={styles.brandName}>Mi Tierrita</div>
            <div className={styles.brandSub}>AGROPECUARIA</div>
          </div>
        </div>
        <div className={styles.list}>
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => isVisibleFor(i, user.role));
            if (items.length === 0) return null;
            return (
              <div key={group.title ?? "main"} style={{ display: "contents" }}>
                {group.title ? <div className={styles.cat}>{group.title}</div> : null}
                {items.map((item) => {
                  const locked = isLockedFor(item, user.role);
                  const count = item.badge ? badges[item.badge] : undefined;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      aria-label={item.label}
                      title={navOpen ? undefined : item.label}
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

      <div className={styles.panel}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={[styles.iconBtn, styles.toggle].join(" ")}
            onClick={() => (window.innerWidth <= 900 ? setMobileOpen((v) => !v) : toggleNav())}
            aria-label={navOpen ? "Ocultar el menú lateral" : "Mostrar el menú lateral"}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="2.5" y="3.5" width="17" height="15" rx="2.6" stroke="currentColor" strokeWidth="1.6" />
              <line x1="8.6" y1="3.5" x2="8.6" y2="18.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <nav className={styles.crumbs} aria-label="Ruta de navegación">
            <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>Mi Tierrita</a>
            <Chevron />
            <strong aria-current="page">{current?.label ?? "Inicio"}</strong>
            <span id="crumb-slot" style={{ display: "contents" }} />
          </nav>
          <span className={styles.saved}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.6 V8.2 L10.4 9.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {fetching > 0 ? "Actualizando…" : `Actualizado ${savedAt}`}
          </span>
          <button type="button" className={styles.iconBtn} aria-label="Notificaciones" onClick={() => navigate("/")}>
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2.5 a4.8 4.8 0 0 1 4.8 4.8 v3.2 l1.4 2.4 h-12.4 l1.4 -2.4 v-3.2 A4.8 4.8 0 0 1 10 2.5 z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8.2 15.6 a1.9 1.9 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {attention ? <span className={styles.dot} /> : null}
          </button>
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
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  );
};

/** Encabezado de página del lienzo: título serif 21px, subtítulo 13px y acciones a la derecha. */
export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div className={styles.pageHead}>
    <div className={styles.pageHeadText}>
      <h1>{title}</h1>
      {subtitle ? <div className={styles.pageSub}>{subtitle}</div> : null}
    </div>
    {actions ? <div className={styles.pageActions}>{actions}</div> : null}
  </div>
);
