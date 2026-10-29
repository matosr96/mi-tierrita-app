import { Link } from "react-router-dom";
import { useAudits } from "@/hooks/audits";
import { dateTime, initials, int } from "@/lib/format";
import { EmptyState, QueryState } from "@/components/ui";
import { METHOD_VERB, methodKind } from "@/screens/Audits/auditMethod";
import { AuditMethodBadge } from "@/screens/Audits/AuditMethodBadge";
import { ResourcePath } from "@/screens/Audits/AuditTimeline";
import { PersonName } from "@/components/people/PersonName";
import styles from "./ActivityFeed.module.css";

const ACTIVITY_LIMIT = 5;

/** Últimas escrituras del equipo, con enlace a la auditoría completa. */
export const ActivityFeed = () => {
  const activity = useAudits({ limit: ACTIVITY_LIMIT });

  return (
    <section className={styles.feed} aria-labelledby="feed-title">
      <header className={styles.head}>
        <div className={styles.headText}>
          <h2 id="feed-title" className={styles.title}>
            Actividad reciente
          </h2>
          <p className={styles.subtitle}>Últimas {int(ACTIVITY_LIMIT)} escrituras del equipo.</p>
        </div>
        <Link to="/auditoria" className={styles.link}>
          Ver toda la auditoría <span aria-hidden="true">→</span>
        </Link>
      </header>

      <QueryState query={activity} isEmpty={(data) => data.items.length === 0} empty={<EmptyState title="Sin actividad registrada" text="Las escrituras aparecerán aquí a medida que el equipo use el sistema." />}>
        {(data) => (
          <ul className={styles.list}>
            {data.items.map((a) => (
              <li key={a.id} className={styles.item}>
                <span className={styles.avatar} aria-hidden="true">
                  {initials(a.username, a.username.slice(1))}
                </span>
                <div className={styles.body}>
                  <p className={styles.sentence}>
                    <strong className={styles.user}>
                      <PersonName userId={a.userId}>{a.username}</PersonName>
                    </strong> {METHOD_VERB[methodKind(a.method)]} <ResourcePath resource={a.resource} />
                  </p>
                  <div className={styles.meta}>
                    <AuditMethodBadge method={a.method} />
                    <time dateTime={a.createdAt}>{dateTime(a.createdAt)}</time>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </section>
  );
};
