import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Card, DataTable, EmptyState, QueryState, StatCard, StatGrid, Tabs, type Column, type TabOption } from "@/components/ui";
import { useAudits } from "@/hooks/audits";
import { useSales } from "@/hooks/sales";
import { useMe } from "@/hooks/session";
import { addDaysIso, dateOnly, dateTime, initials, int, money, todayIso } from "@/lib/format";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import type { Sale, User } from "@/types/api";
import { AuditTimeline } from "@/screens/Audits/AuditTimeline";
import { PasswordForm } from "./PasswordForm";
import { ProfileForm } from "./ProfileForm";
import styles from "./ProfileScreen.module.css";

type ProfileTab = "datos" | "seguridad" | "actividad";

const saleColumns: Column<Sale>[] = [
  { key: "date", header: "Fecha", render: (s) => dateTime(s.createdAt) },
  { key: "customer", header: "Cliente", align: "left", render: (s) => s.customerName ?? "Consumidor final" },
  { key: "payment", header: "Pago", align: "left", render: (s) => (s.paymentType === "CASH" ? "Contado" : "Crédito") },
  { key: "total", header: "Total", align: "right", render: (s) => money(s.total) },
];

/** Ventana de "Mi actividad". */
const DAYS = 30;

/** Lo que hizo la persona en el sistema: el administrador ve su rastro de auditoría; la secretaria, sus ventas. */
const Activity = ({ user }: { user: User }) => {
  const from = addDaysIso(todayIso(), -DAYS);
  const isAdmin = user.role === "ADMIN";
  const audits = useAudits({ userId: user.id, from, limit: 12 });
  const sales = useSales({ userId: user.id, from, limit: 10 });
  return (
    <div className={styles.stack}>
      <StatGrid>
        <StatCard label="Ventas registradas" value={sales.data ? int(sales.data.count) : "…"} hint={`últimos ${DAYS} días`} />
        {isAdmin ? <StatCard label="Acciones en el sistema" value={audits.data ? int(audits.data.count) : "…"} hint={`últimos ${DAYS} días · auditoría`} /> : null}
      </StatGrid>
      {isAdmin ? (
        <Card title="Últimas acciones" subtitle="Tomadas de la auditoría: lo que usted registró, cambió o dio de baja">
          <QueryState query={audits} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Sin acciones recientes" text={`No hay registros suyos en los últimos ${DAYS} días.`} />}>
            {(page) => <AuditTimeline items={page.items} />}
          </QueryState>
        </Card>
      ) : (
        <Card title="Mis últimas ventas" subtitle={`Registradas por usted en los últimos ${DAYS} días`}>
          <QueryState query={sales} isEmpty={(p) => p.items.length === 0} empty={<EmptyState title="Sin ventas recientes" />}>
            {(page) => <DataTable columns={saleColumns} rows={page.items} rowKey={(s) => s.id} />}
          </QueryState>
        </Card>
      )}
    </div>
  );
};

/** Mi perfil (prototipos 15–17 del Figma): datos de la cuenta, cambio de contraseña y actividad reciente. */
export const ProfileScreen = () => {
  const sessionUser = useSessionStore((s) => s.user);
  // Datos frescos del servidor (correo y teléfono incluidos); mientras llegan, los de la sesión.
  const me = useMe();
  const user = me.data ?? sessionUser;
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  if (!user) return null;

  // La bodega no tiene un rastro propio que la API permita consultar: su perfil no muestra "Mi actividad".
  const options: TabOption<ProfileTab>[] = [
    { value: "datos", label: "Datos personales" },
    { value: "seguridad", label: "Seguridad" },
    ...(user.role === "WAREHOUSE" ? [] : [{ value: "actividad" as const, label: "Mi actividad" }]),
  ];
  const tab: ProfileTab = options.some((o) => o.value === tabParam) ? (tabParam as ProfileTab) : "datos";
  const go = (t: ProfileTab) => navigate(t === "datos" ? "/perfil" : `/perfil/${t}`);

  return (
    <>
      <PageHeader title="Mi *perfil*" subtitle="Sus datos, su contraseña y lo que ha hecho en el sistema." />

      <div className={styles.layout}>
        <aside className={styles.idCard}>
          <div className={styles.avatar}>{initials(user.firstName, user.lastName)}</div>
          <h2 className={styles.name}>
            {user.firstName} {user.lastName}
          </h2>
          <span className={styles.handle}>@{user.username}</span>
          <Badge tone="neutral">{ROLE_LABELS[user.role]}</Badge>
          {user.email || user.phone ? (
            <ul className={styles.contact}>
              {user.email ? <li>{user.email}</li> : null}
              {user.phone ? <li>{user.phone}</li> : null}
            </ul>
          ) : null}
          <dl className={styles.facts}>
            <div>
              <dt>Miembro desde</dt>
              <dd>{dateOnly(user.createdAt)}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{user.active ? "Cuenta activa" : "Cuenta inactiva"}</dd>
            </div>
          </dl>
        </aside>

        <div className={styles.main}>
          <Tabs options={options} value={tab} onChange={go} />
          {tab === "datos" ? (
            <Card title="Datos personales" subtitle="Así aparece su nombre en las ventas, el chat y los reportes">
              <ProfileForm key={`${user.id}-${me.dataUpdatedAt}`} user={user} />
            </Card>
          ) : tab === "seguridad" ? (
            <Card title="Cambiar contraseña" subtitle="Use una contraseña que no use en otros sitios. La sesión actual sigue activa.">
              <PasswordForm />
            </Card>
          ) : (
            <Activity user={user} />
          )}
        </div>
      </div>
    </>
  );
};
