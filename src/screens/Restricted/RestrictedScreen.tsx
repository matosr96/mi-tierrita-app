import { useLocation, useNavigate } from "react-router-dom";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { Role } from "@/types/api";
import { Button } from "@/components/ui";
import { findRoute } from "@/router/navigation";
import styles from "./RestrictedScreen.module.css";

const LockIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.2 10.5 V7.4 a3.8 3.8 0 0 1 7.6 0 V10.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="15.8" r="1.5" fill="currentColor" />
  </svg>
);

const describe = (roles: Role[]): string => {
  const names = roles.map((r) => ROLE_LABELS[r].toLowerCase());
  if (names.length === 1) return `el ${names[0]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
};

/** Pantalla de Acceso restringido (RNF-01), fiel a la vista "Secretaria · Acceso restringido" del lienzo. */
export const RestrictedScreen = ({ roles }: { roles: Role[] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useSessionStore((s) => s.user?.role);
  const module = findRoute(location.pathname)?.label ?? "Este módulo";
  const secondary = role === "SALES" ? { to: "/ventas", label: "Ir al punto de venta" } : role === "WAREHOUSE" ? { to: "/inventario", label: "Ir al inventario" } : null;
  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.circle}>
          <LockIcon />
        </div>
        <h1>{module} no está disponible para su cuenta</h1>
        <p>
          {module === "Finanzas y crédito"
            ? "Este módulo contiene la evaluación de inversiones y las proyecciones financieras del negocio."
            : "Este módulo no forma parte de las tareas de su rol."}{" "}
          Está reservado para {describe(roles)}.
        </p>
        <p>Si necesita una cifra de este módulo, pídasela al administrador.</p>
        <div className={styles.actions}>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
          {secondary ? (
            <Button variant="secondary" onClick={() => navigate(secondary.to)}>
              {secondary.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const NotFoundScreen = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.circle}>
          <LockIcon />
        </div>
        <h1>Página no encontrada</h1>
        <div className={styles.actions}>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    </div>
  );
};
