import { useState } from "react";
import { Link } from "react-router-dom";
import { useUsers } from "@/hooks/users";
import { useAudits } from "@/hooks/audits";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { NAV_GROUPS, rolesFor, type NavItem } from "@/router/navigation";
import { dateTime, int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, DataTable, EmptyState, Pagination, QueryState, type Column } from "@/components/ui";
import type { Audit, Role, User } from "@/types/api";
import { AuditMethodBadge } from "@/screens/Audits/AuditMethodBadge";
import { UserFormModal } from "./UserFormModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import styles from "./UsersScreen.module.css";

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

const AccessMark = ({ access }: { access: Access }) =>
  access === "full" ? (
    <span className={styles.full} title="Acceso completo">
      ✓
    </span>
  ) : access === "consult" ? (
    <span className={styles.consult} title="Consulta">
      ○
    </span>
  ) : (
    <span className={styles.none} title="Sin acceso">
      —
    </span>
  );

const permissionColumns: Column<NavItem>[] = [
  { key: "module", header: "Módulo", render: (m) => m.label },
  ...ROLES.map<Column<NavItem>>((role) => ({ key: role, header: ROLE_LABELS[role], align: "center", render: (m) => <AccessMark access={accessFor(m, role)} /> })),
];

const ACTIVITY_LIMIT = 5;

const activityColumns: Column<Audit>[] = [
  { key: "createdAt", header: "Fecha y hora", render: (a) => <span className={styles.date}>{dateTime(a.createdAt)}</span> },
  { key: "username", header: "Usuario", align: "left", render: (a) => <span className={styles.name}>{a.username}</span> },
  { key: "resource", header: "Recurso", align: "left", render: (a) => <span className={styles.mono}>{a.resource}</span> },
  { key: "method", header: "Método", align: "left", render: (a) => <AuditMethodBadge method={a.method} /> },
];

/** CU-03 Usuarios y roles (solo ADMIN) y CU-04 cambio de contraseña propia. */
export const UsersScreen = () => {
  const me = useSessionStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const query = useUsers({ page, limit: 20 });
  const activity = useAudits({ limit: ACTIVITY_LIMIT });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Persona",
      render: (u) => (
        <span className={styles.name}>
          {u.firstName} {u.lastName}
          {me?.id === u.id ? <span className={styles.you}>(usted)</span> : null}
        </span>
      ),
    },
    { key: "username", header: "Usuario", align: "left", render: (u) => <span className={styles.username}>{u.username}</span> },
    { key: "role", header: "Rol", align: "left", render: (u) => ROLE_LABELS[u.role] },
    { key: "active", header: "Estado", align: "left", render: (u) => <Badge tone={u.active ? "good" : "neutral"}>{u.active ? "Activa" : "Inactiva"}</Badge> },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuarios y roles"
        subtitle="Cuentas con acceso al sistema y lo que puede hacer cada rol."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowPassword(true)}>
              Cambiar mi contraseña
            </Button>
            <Button onClick={() => setShowForm(true)}>Nuevo usuario</Button>
          </>
        }
      />

      <div className={styles.grid}>
        <Card title="Cuentas" subtitle={query.data ? `${int(query.data.count)} cuentas` : undefined} className={styles.card}>
          <QueryState
            query={query}
            isEmpty={(data) => data.items.length === 0}
            empty={<EmptyState title="No hay usuarios" text="Cree la primera cuenta para que el equipo pueda entrar al sistema." action={<Button onClick={() => setShowForm(true)}>Nuevo usuario</Button>} />}
          >
            {(data) => (
              <>
                <DataTable columns={columns} rows={data.items} rowKey={(u) => u.id} />
                <div className={styles.pager}>
                  <Pagination page={data} onPage={setPage} />
                </div>
              </>
            )}
          </QueryState>
        </Card>

        <Card title="Módulos por rol" subtitle="Lo que puede usar cada rol" className={styles.card}>
          <DataTable columns={permissionColumns} rows={MODULES} rowKey={(m) => m.path} />
          <div className={styles.legend}>
            <span>
              <span className={styles.full}>✓</span> acceso completo
            </span>
            <span>
              <span className={styles.consult}>○</span> consulta
            </span>
            <span>
              <span className={styles.none}>—</span> sin acceso
            </span>
          </div>
        </Card>
      </div>

      <Card
        title="Registro de actividad"
        subtitle={`Últimas ${int(ACTIVITY_LIMIT)} escrituras`}
        className={styles.card}
        actions={
          <Link to="/auditoria" className={styles.cardLink}>
            Ver toda la auditoría
          </Link>
        }
      >
        <QueryState query={activity} isEmpty={(data) => data.items.length === 0} empty={<EmptyState title="Sin actividad registrada" text="Las escrituras aparecerán aquí a medida que el equipo use el sistema." />}>
          {(data) => <DataTable columns={activityColumns} rows={data.items} rowKey={(a) => a.id} />}
        </QueryState>
      </Card>

      {showForm ? <UserFormModal onClose={() => setShowForm(false)} /> : null}
      {showPassword ? <ChangePasswordModal onClose={() => setShowPassword(false)} /> : null}
    </div>
  );
};
