import { useState } from "react";
import { useUsers } from "@/hooks/users";
import { useSessionStore } from "@/stores/session";
import { int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Odometer } from "@/components/motion";
import { Button, EmptyState, Pagination, QueryState } from "@/components/ui";
import { AccessMatrix } from "./AccessMatrix";
import { ActivityFeed } from "./ActivityFeed";
import { PersonCard } from "./PersonCard";
import { UserFormModal } from "./UserFormModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import styles from "./UsersScreen.module.css";

/** CU-03 Usuarios y roles (solo ADMIN) y CU-04 cambio de contraseña propia. */
export const UsersScreen = () => {
  const me = useSessionStore((s) => s.user);
  const canCreate = me?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const query = useUsers({ page, limit: 20 });

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
            {canCreate ? <Button onClick={() => setShowForm(true)}>Nuevo usuario</Button> : null}
          </>
        }
      />

      <section className={styles.team} aria-labelledby="team-title">
        <header className={styles.teamHead}>
          <div>
            <div className={styles.label}>Equipo · cuentas</div>
            <h2 id="team-title" className={styles.title}>
              Quién entra <em>al sistema</em>
            </h2>
          </div>
          <div className={styles.count}>
            <span className={styles.countValue}>{query.data ? <Odometer value={int(query.data.count)} /> : "—"}</span>
            <span className={styles.countLabel}>cuentas</span>
          </div>
        </header>

        <QueryState
          query={query}
          isEmpty={(data) => data.items.length === 0}
          empty={
            <EmptyState
              title="No hay usuarios"
              text="Cree la primera cuenta para que el equipo pueda entrar al sistema."
              action={canCreate ? <Button onClick={() => setShowForm(true)}>Nuevo usuario</Button> : undefined}
            />
          }
        >
          {(data) => (
            <>
              <ul className={styles.people}>
                {data.items.map((u, i) => (
                  <PersonCard key={u.id} user={u} index={i} isMe={me?.id === u.id} onChangePassword={() => setShowPassword(true)} />
                ))}
                {canCreate ? (
                  <li className={styles.addItem} style={{ animationDelay: `${data.items.length * 55 + 80}ms` }}>
                    <button type="button" className={styles.add} onClick={() => setShowForm(true)}>
                      <span className={styles.addPlus} aria-hidden="true">
                        +
                      </span>
                      <span className={styles.addText}>Nuevo usuario</span>
                      <span className={styles.addHint}>Nombre, usuario, contraseña y rol</span>
                    </button>
                  </li>
                ) : null}
              </ul>
              <Pagination page={data} onPage={setPage} />
            </>
          )}
        </QueryState>
      </section>

      <div className={styles.split}>
        <AccessMatrix myRole={me?.role} />
        <ActivityFeed />
      </div>

      {showForm ? <UserFormModal onClose={() => setShowForm(false)} /> : null}
      {showPassword ? <ChangePasswordModal onClose={() => setShowPassword(false)} /> : null}
    </div>
  );
};
