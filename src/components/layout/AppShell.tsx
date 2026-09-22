import { useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import { useThemeStore } from "@/stores/theme";
import { useSignout } from "@/hooks/session";
import { NAV_GROUPS, findRoute } from "@/router/navigation";
import { initials } from "@/lib/format";
import { Toasts } from "@/components/ui";
import styles from "./AppShell.module.css";

const Logo = () => (
  <span className={styles.logo} aria-hidden="true">
    <svg width="20" height="20" viewBox="0 0 32 32">
      <path d="M16 25V14M16 14c-4 0-7-3-7-7 4 0 7 3 7 7zm0 0c4 0 7-3 7-7-4 0-7 3-7 7z" fill="none" stroke="#1B4332" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

/** Barra lateral + barra superior + contenido. El menú solo muestra los módulos del rol activo. */
export const AppShell = () => {
  const user = useSessionStore((s) => s.user);
  const { mode, setMode } = useThemeStore();
  const signout = useSignout();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const current = findRoute(location.pathname);
  if (!user) return null;

  return (
    <div className={styles.shell}>
      <aside className={[styles.sidebar, open ? styles.sidebarOpen : ""].join(" ")}>
        <div className={styles.brand}>
          <Logo />
          <span className={styles.brandName}>Mi Tierrita</span>
          <span className={styles.brandSub}>Agropecuaria</span>
        </div>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => i.roles.includes(user.role));
          if (items.length === 0) return null;
          return (
            <div key={group.title ?? "main"}>
              {group.title ? <div className={styles.group}>{group.title}</div> : null}
              {items.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === "/"} className={({ isActive }) => [styles.link, isActive ? styles.active : ""].join(" ")} onClick={() => setOpen(false)}>
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
        <div className={styles.spacer} />
        <div className={styles.signout}>
          <button type="button" className={styles.signoutBtn} onClick={() => signout.mutate(undefined)}>
            <span aria-hidden="true">⇥</span> Cerrar sesión
          </button>
        </div>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumbs}>
            <button type="button" className={[styles.themeBtn, styles.menuBtn].join(" ")} onClick={() => setOpen((v) => !v)} aria-label="Menú">
              ☰
            </button>
            <span>Mi Tierrita</span>
            <span>›</span>
            <strong>{current?.label ?? "Inicio"}</strong>
          </div>
          <div className={styles.user}>
            <button type="button" className={styles.themeBtn} onClick={() => setMode(mode === "dark" ? "light" : mode === "light" ? "system" : "dark")} title="Tema">
              {mode === "dark" ? "Oscuro" : mode === "light" ? "Claro" : "Auto"}
            </button>
            <span className={styles.avatar}>{initials(user.firstName, user.lastName)}</span>
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

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
    <div>
      <h1>{title}</h1>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
    </div>
    {actions ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div> : null}
  </div>
);
