import { useState } from "react";
import { useUsers } from "@/hooks/users";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { NAV_GROUPS, type NavItem } from "@/router/navigation";
import { dateOnly } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, DataTable, EmptyState, Pagination, QueryState, type Column } from "@/components/ui";
import type { Role, User } from "@/types/api";
import { UserFormModal } from "./UserFormModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import styles from "./UsersScreen.module.css";

const ROLES: Role[] = ["ADMIN", "SALES", "WAREHOUSE"];
const ROLE_TONE: Record<Role, "good" | "neutral" | "warn"> = { ADMIN: "good", SALES: "neutral", WAREHOUSE: "warn" };

/** Módulos del menú (sin Inicio) para la matriz de permisos por rol. */
const MODULES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.path !== "/");

const permissionColumns: Column<NavItem>[] = [
  { key: "module", header: "Módulo", render: (m) => m.label },
  ...ROLES.map<Column<NavItem>>((role) => ({
    key: role,
    header: ROLE_LABELS[role],
    align: "center",
    render: (m) => (m.roles.includes(role) ? <span className={styles.yes}>Sí</span> : <span className={styles.no}>No</span>),
  })),
];

/** CU-03 Usuarios y roles (solo ADMIN) y CU-04 cambio de contraseña propia. */
export const UsersScreen = () => {
  const me = useSessionStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const query = useUsers({ page, limit: 20 });

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (u) => (
        <span className={styles.name}>
          {u.firstName} {u.lastName}
          {me?.id === u.id ? <span className={styles.you}>(usted)</span> : null}
        </span>
      ),
    },
    { key: "username", header: "Usuario", render: (u) => <span className={styles.mono}>{u.username}</span> },
    { key: "role", header: "Rol", render: (u) => <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge> },
    { key: "active", header: "Estado", render: (u) => <Badge tone={u.active ? "good" : "neutral"}>{u.active ? "Activo" : "Inactivo"}</Badge> },
    { key: "createdAt", header: "Creado", render: (u) => dateOnly(u.createdAt) },
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
        <Card title="Cuentas" flush>
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

        <Card title="Módulos por rol" subtitle="Lo que ve cada rol en el menú" flush>
          <DataTable columns={permissionColumns} rows={MODULES} rowKey={(m) => m.path} />
        </Card>
      </div>

      <p className={styles.note}>La API aún no permite editar ni desactivar usuarios: por ahora solo se crean cuentas y cada persona cambia su propia contraseña.</p>

      {showForm ? <UserFormModal onClose={() => setShowForm(false)} /> : null}
      {showPassword ? <ChangePasswordModal onClose={() => setShowPassword(false)} /> : null}
    </div>
  );
};
