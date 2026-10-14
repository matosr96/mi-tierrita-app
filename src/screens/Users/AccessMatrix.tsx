import { useState, type CSSProperties } from "react";
import { TopoField } from "@/components/motion";
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

const ACCESS_TEXT: Record<Access, string> = { full: "acceso completo", consult: "consulta", none: "sin acceso" };

/** Cuántos módulos abre cada rol: se lee de la configuración del menú, no es una cifra de negocio. */
const OPEN: Record<Role, number> = Object.fromEntries(ROLES.map((r) => [r, MODULES.filter((m) => accessFor(m, r) !== "none").length])) as Record<Role, number>;

const Mark = ({ access }: { access: Access }) =>
  access === "full" ? (
    <svg className={styles.glyph} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10.5 L8.5 14 L15 6.5" pathLength={1} />
    </svg>
  ) : access === "consult" ? (
    <svg className={styles.glyph} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2.5 10 C5 5.5 15 5.5 17.5 10 C15 14.5 5 14.5 2.5 10 Z" pathLength={1} />
      <circle cx="10" cy="10" r="2.2" className={styles.pupil} />
    </svg>
  ) : (
    <span className={styles.dot} aria-hidden="true" />
  );

const CELL_CLASS: Record<Access, string | undefined> = { full: styles.full, consult: styles.consult, none: styles.none };

type Hot = { row: number; col: number } | null;

/** Matriz roles × módulos: celdas que se encienden en diagonal y resaltan su fila y su columna al pasar el cursor. */
export const AccessMatrix = ({ myRole }: { myRole?: Role }) => {
  const [hot, setHot] = useState<Hot>(null);

  return (
    <section className={styles.panel} aria-labelledby="matrix-title">
      <TopoField className={styles.topo} rings={9} signal={4} seed={2.6} />
      <header className={styles.head}>
        <div className={styles.label}>Permisos · roles × módulos</div>
        <h2 id="matrix-title" className={styles.title}>
          Lo que abre <em>cada rol</em>
        </h2>
      </header>

      <div className={styles.scroller}>
        <div className={styles.grid} role="table" aria-label="Módulos por rol" onPointerLeave={() => setHot(null)} style={{ "--cols": ROLES.length } as CSSProperties}>
          <div className={styles.row} role="row">
            <div className={[styles.corner, styles.colHead].join(" ")} role="columnheader">
              Módulo
            </div>
            {ROLES.map((role, c) => (
              <div
                key={role}
                role="columnheader"
                className={[styles.colHead, styles.roleHead, hot?.col === c ? styles.hotCol : "", role === myRole ? styles.mine : ""].join(" ")}
                style={{ "--c": c } as CSSProperties}
              >
                <span className={styles.roleName}>{ROLE_LABELS[role]}</span>
                <span className={styles.roleCount}>
                  {int(OPEN[role])}/{int(MODULES.length)}
                  {role === myRole ? <span className={styles.mineTag}>su rol</span> : null}
                </span>
              </div>
            ))}
          </div>

          {MODULES.map((m, r) => (
            <div key={m.path} role="row" className={[styles.row, hot?.row === r ? styles.hotRow : ""].join(" ")}>
              <div role="rowheader" className={styles.module} onPointerEnter={() => setHot({ row: r, col: -1 })}>
                <svg className={styles.icon} viewBox="0 0 22 22" aria-hidden="true" dangerouslySetInnerHTML={{ __html: m.icon }} />
                <span>{m.label}</span>
              </div>
              {ROLES.map((role, c) => {
                const access = accessFor(m, role);
                const isHot = hot !== null && (hot.row === r || hot.col === c);
                return (
                  <div
                    key={role}
                    role="cell"
                    tabIndex={0}
                    aria-label={`${ROLE_LABELS[role]} en ${m.label}: ${ACCESS_TEXT[access]}`}
                    title={`${ROLE_LABELS[role]} · ${ACCESS_TEXT[access]}`}
                    className={[styles.cell, CELL_CLASS[access], isHot ? styles.hot : "", hot?.row === r && hot.col === c ? styles.focus : ""].join(" ")}
                    style={{ "--r": r, "--c": c } as CSSProperties}
                    onPointerEnter={() => setHot({ row: r, col: c })}
                    onFocus={() => setHot({ row: r, col: c })}
                    onBlur={() => setHot(null)}
                  >
                    <span className={styles.tile}>
                      <Mark access={access} />
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ul className={styles.legend}>
        {(["full", "consult", "none"] as Access[]).map((a) => (
          <li key={a} className={[styles.legendItem, CELL_CLASS[a]].join(" ")}>
            <span className={[styles.tile, styles.legendTile].join(" ")}>
              <Mark access={a} />
            </span>
            {ACCESS_TEXT[a]}
          </li>
        ))}
      </ul>
    </section>
  );
};
