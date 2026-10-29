import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { TitaOrb } from "@/components/ai/TitaOrb";
import { Card, Tabs } from "@/components/ui";
import { useSessionStore, ROLE_LABELS } from "@/stores/session";
import type { Role } from "@/types/api";
import { GENERAL_MANUAL, ROLE_MANUALS, ROLE_SLUG } from "./titaManual";
import styles from "./TitaManualScreen.module.css";

const SLUG: Record<Role, string> = { ADMIN: "administrador", SALES: "secretaria", WAREHOUSE: "bodega" };

/**
 * Manual de Tita dentro de la app: el general (qué es, cómo abrirla, cómo preguntar, historial, confirmación, @Tita y
 * errores) y uno por rol (qué puede preguntar y hacer cada puesto, con ejemplos y lo que no puede pedir). Cualquier
 * rol puede leer los tres manuales; el suyo aparece primero.
 */
export const TitaManualScreen = () => {
  const user = useSessionStore((s) => s.user);
  const { rol } = useParams();
  const navigate = useNavigate();
  const selected: Role | "general" = rol ? (ROLE_SLUG[rol.toLowerCase()] ?? "general") : "general";
  if (!user) return null;
  const roles: Role[] = [user.role, ...(["ADMIN", "SALES", "WAREHOUSE"] as Role[]).filter((r) => r !== user.role)];
  const options = [{ value: "general", label: "Manual general" }, ...roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))];

  return (
    <>
      <PageHeader title="Manual de Tita" subtitle="Qué es, cómo usarla y qué puede pedirle cada rol." actions={<Link to="/tita" className={styles.back}>Ir a Tita</Link>} />
      <div className={styles.tabs}>
        <Tabs
          ariaLabel="Manuales"
          value={selected}
          options={options}
          onChange={(v) => navigate(v === "general" ? "/ayuda/tita" : `/ayuda/tita/${SLUG[v as Role]}`)}
        />
      </div>
      <div className={styles.layout}>
        <aside className={styles.side}>
          <Card>
            <div className={styles.who}>
              <TitaOrb size={64} />
              <div>
                <strong>Tita</strong>
                <span>Asistente de Mi Tierrita</span>
              </div>
            </div>
            {selected === "general" ? (
              <nav aria-label="Secciones del manual">
                <ol className={styles.toc}>
                  {GENERAL_MANUAL.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`}>{s.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <p className={styles.note}>Manual para el rol {ROLE_LABELS[selected]}. Lo que no está en «puede pedir» Tita lo responde como «no disponible para su cuenta».</p>
            )}
          </Card>
        </aside>
        <section className={styles.body}>
          {selected === "general" ? (
            GENERAL_MANUAL.map((s) => (
              <Card key={s.id} title={s.title}>
                <div id={s.id} className={styles.anchor} />
                {s.paragraphs.map((p) => (
                  <p key={p} className={styles.p}>
                    {p}
                  </p>
                ))}
                {s.steps ? (
                  <ol className={styles.steps}>
                    {s.steps.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                ) : null}
                {s.bullets ? (
                  <ul className={styles.bullets}>
                    {s.bullets.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))
          ) : (
            <RoleManualView role={selected} />
          )}
        </section>
      </div>
    </>
  );
};

const RoleManualView = ({ role }: { role: Role }) => {
  const m = ROLE_MANUALS[role];
  return (
    <>
      <Card title={m.title}>
        <p className={styles.p}>{m.intro}</p>
      </Card>
      <Card title="Qué puede preguntar">
        <ul className={styles.bullets}>
          {m.canAsk.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
      <Card title="Qué puede hacer (siempre con su confirmación)">
        <ul className={styles.bullets}>
          {m.canDo.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
      <Card title="Ejemplos">
        <ul className={styles.examples}>
          {m.examples.map((t) => (
            <li key={t}>«{t}»</li>
          ))}
        </ul>
      </Card>
      <Card title="Lo que no puede pedir">
        <ul className={styles.bullets}>
          {m.cannot.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Card>
    </>
  );
};
