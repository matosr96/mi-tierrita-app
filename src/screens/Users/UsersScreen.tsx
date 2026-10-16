import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "@/hooks/users";
import { useSessionStore } from "@/stores/session";
import { int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, EmptyState, Pagination, QueryState } from "@/components/ui";
import { AccessMatrix } from "./AccessMatrix";
import { ActivityFeed } from "./ActivityFeed";
import { PersonCard } from "./PersonCard";
import { UserFormModal } from "./UserFormModal";
import styles from "./UsersScreen.module.css";

/** CU-03 Usuarios y roles (solo ADMIN). El cambio de contraseña propia (CU-04) vive en Mi perfil › Seguridad. */
export const UsersScreen = () => {
  const me = useSessionStore((s) => s.user);
  const canCreate = me?.role === "ADMIN";
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const query = useUsers({ page, limit: 20 });

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuarios y roles"
        subtitle="Cuentas con acceso al sistema y lo que puede hacer cada rol."
        actions={canCreate ? <Button onClick={() => setShowForm(true)}>Nuevo usuario</Button> : null}
      />

      <section className={styles.team} aria-labelledby="team-title">
        <header className={styles.teamHead}>
          <h2 id="team-title" className={styles.title}>
            Equipo
          </h2>
          <span className={styles.count}>{query.data ? `${int(query.data.count)} ${query.data.count === 1 ? "cuenta" : "cuentas"}` : "…"}</span>
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
                {data.items.map((u) => (
                  <PersonCard key={u.id} user={u} isMe={me?.id === u.id} onChangePassword={() => navigate("/perfil/seguridad")} />
                ))}
                {canCreate ? (
                  <li className={styles.addItem}>
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
    </div>
  );
};
