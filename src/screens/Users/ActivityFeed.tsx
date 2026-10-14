import { Fragment, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAudits } from "@/hooks/audits";
import { dateTime, initials, int } from "@/lib/format";
import { EmptyState, QueryState } from "@/components/ui";
import { METHOD_VERB, methodKind, pathSegments, splitDateTime } from "@/screens/Audits/auditMethod";
import styles from "./ActivityFeed.module.css";

const ACTIVITY_LIMIT = 5;
const KIND_CLASS = { create: styles.kCreate, update: styles.kUpdate, remove: styles.kRemove, other: styles.kOther };

/** Últimas escrituras del equipo como un feed en vivo, con enlace a la auditoría completa. */
export const ActivityFeed = () => {
  const activity = useAudits({ limit: ACTIVITY_LIMIT });

  return (
    <section className={styles.feed} aria-labelledby="feed-title">
      <header className={styles.head}>
        <div>
          <div className={styles.label}>
            <span className={styles.live} aria-hidden="true" />
            En vivo · últimas {int(ACTIVITY_LIMIT)} escrituras
          </div>
          <h2 id="feed-title" className={styles.title}>
            Registro de <em>actividad</em>
          </h2>
        </div>
        <Link to="/auditoria" className={styles.link}>
          Ver toda la auditoría <span aria-hidden="true">→</span>
        </Link>
      </header>

      <QueryState query={activity} isEmpty={(data) => data.items.length === 0} empty={<EmptyState title="Sin actividad registrada" text="Las escrituras aparecerán aquí a medida que el equipo use el sistema." />}>
        {(data) => (
          <ol className={styles.list}>
            {data.items.map((a, i) => {
              const kind = methodKind(a.method);
              const { day, time } = splitDateTime(dateTime(a.createdAt));
              return (
                <li key={a.id} className={[styles.item, KIND_CLASS[kind]].join(" ")} style={{ "--i": i } as CSSProperties}>
                  <span className={styles.avatar} aria-hidden="true">
                    {initials(a.username, a.username.slice(1))}
                    <span className={styles.pip} />
                  </span>
                  <div className={styles.body}>
                    <p className={styles.sentence}>
                      <strong className={styles.user}>{a.username}</strong> <span className={styles.verb}>{METHOD_VERB[kind]}</span>{" "}
                      <code className={styles.path}>
                        {pathSegments(a.resource).map((p, k) => (
                          <Fragment key={k}>
                            <span className={styles.slash}>/</span>
                            <span className={p.id ? styles.segId : undefined}>{p.text}</span>
                          </Fragment>
                        ))}
                      </code>
                    </p>
                    <div className={styles.meta}>
                      <span className={styles.method}>{a.method.toUpperCase()}</span>
                      <time dateTime={a.createdAt}>
                        {day} · {time}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </QueryState>
    </section>
  );
};
