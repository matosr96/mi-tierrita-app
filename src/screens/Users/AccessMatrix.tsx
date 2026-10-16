import { int } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import { NAV_GROUPS, rolesFor, type NavItem } from "@/router/navigation";
import type { Role } from "@/types/api";
import styles from "./AccessMatrix.module.css";

const ROLES: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];

/** Módulos del menú (sin Inicio) para la matriz de permisos por rol. */
const MODULES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.path !== "/");

/**
 * Módulos que el rol ve solo en consulta (lienzo, documento 06): la Secretaria consulta Inventario sin
 * registrar lotes ni productos; Bodega consulta Proveedores sin crearlos ni editarlos.
 */
const CONSULT: Record<string, Role[]> = { "/inventario": ["SALES"], "/proveedores": ["WAREHOUSE"] };

type Access = "full" | "consult" | "none";
const accessFor = (module: NavItem, role: Role): Access => (!rolesFor(module.path).includes(role) ? "none" : (CONSULT[module.path]?.includes(role) ?? false) ? "consult" : "full");

const ACCESS_TEXT: Record<Access, string> = { full: "Acceso completo", consult: "Consulta", none: "Sin acceso" };

/** Cuántos módulos abre cada rol: se lee de la configuración del menú, no es una cifra de negocio. */
const OPEN: Record<Role, number> = Object.fromEntries(ROLES.map((r) => [r, MODULES.filter((m) => accessFor(m, r) !== "none").length])) as Record<Role, number>;

const CELL_CLASS: Record<Access, string | undefined> = { full: styles.full, consult: styles.consult, none: styles.none };

const Mark = ({ access }: { access: Access }) =>
  access === "full" ? (
    <svg className={styles.glyph} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10.5 L8.5 14 L15 6.5" />
    </svg>
  ) : access === "consult" ? (
    <svg className={styles.glyph} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.5 10 C5 5.5 15 5.5 17.5 10 C15 14.5 5 14.5 2.5 10 Z" />
      <circle cx="10" cy="10" r="2.2" className={styles.pupil} />
    </svg>
  ) : (
    <span className={styles.dash} aria-hidden="true" />
  );

/** Matriz roles × módulos como tabla: acceso completo, solo consulta o sin acceso. */
export const AccessMatrix = ({ myRole }: { myRole?: Role }) => (
  <section className={styles.panel} aria-labelledby="matrix-title">
    <header className={styles.head}>
      <h2 id="matrix-title" className={styles.title}>
        Permisos por rol
      </h2>
      <p className={styles.subtitle}>Módulos del menú que abre cada rol.</p>
    </header>

    <div className={styles.scroller}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.moduleHead}>
              Módulo
            </th>
            {ROLES.map((role) => (
              <th key={role} scope="col" className={[styles.roleHead, role === myRole ? styles.mine : ""].join(" ")}>
                <span className={styles.roleName}>{ROLE_LABELS[role]}</span>
                <span className={styles.roleCount}>
                  {int(OPEN[role])} de {int(MODULES.length)}
                  {role === myRole ? " · su rol" : ""}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((m) => (
            <tr key={m.path}>
              <th scope="row" className={styles.module}>
                <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.icon }} />
                <span>{m.label}</span>
              </th>
              {ROLES.map((role) => {
                const access = accessFor(m, role);
                return (
                  <td key={role} className={[styles.cell, CELL_CLASS[access]].join(" ")} title={`${ROLE_LABELS[role]} · ${ACCESS_TEXT[access]}`}>
                    <Mark access={access} />
                    <span className={styles.srOnly}>{`${ROLE_LABELS[role]} en ${m.label}: ${ACCESS_TEXT[access].toLowerCase()}`}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className={styles.legend}>
      {(["full", "consult", "none"] as Access[]).map((a) => (
        <li key={a} className={[styles.legendItem, CELL_CLASS[a]].join(" ")}>
          <Mark access={a} />
          {ACCESS_TEXT[a]}
        </li>
      ))}
    </ul>
  </section>
);
