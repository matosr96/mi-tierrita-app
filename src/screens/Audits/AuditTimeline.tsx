import { Fragment } from "react";
import { dateTime } from "@/lib/format";
import { Badge } from "@/components/ui";
import type { Audit } from "@/types/api";
import { AuditMethodBadge } from "./AuditMethodBadge";
import { METHOD_VERB, methodKind, pathSegments, splitDateTime } from "./auditMethod";
import styles from "./AuditTimeline.module.css";

/** Ruta del recurso con los segmentos numéricos (identificadores) resaltados. */
export const ResourcePath = ({ resource, className }: { resource: string; className?: string }) => {
  const parts = pathSegments(resource);
  return (
    <code className={[styles.path, className ?? ""].join(" ")} title={resource}>
      {parts.length === 0 ? <span className={styles.slash}>/</span> : null}
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span className={styles.slash}>/</span>
          <span className={p.id ? styles.segId : undefined}>{p.text}</span>
        </Fragment>
      ))}
    </code>
  );
};

/** Bitácora agrupada por día: hora, método HTTP, quién, qué recurso y número de registro. */
export const AuditTimeline = ({ items }: { items: Audit[] }) => {
  let lastDay = "";
  return (
    <ol className={styles.log} aria-label="Escrituras registradas">
      {items.map((a) => {
        const { day, time } = splitDateTime(dateTime(a.createdAt));
        const newDay = day !== lastDay;
        lastDay = day;
        return (
          <li key={a.id} className={styles.entry}>
            {newDay ? <div className={styles.day}>{day}</div> : null}
            <div className={styles.row}>
              <time className={styles.time} dateTime={a.createdAt}>
                {time}
              </time>
              <span className={styles.method}>
                <AuditMethodBadge method={a.method} />
              </span>
              <span className={styles.line}>
                <span className={styles.user}>{a.username}</span> <span className={styles.verb}>{METHOD_VERB[methodKind(a.method)]}</span> <ResourcePath resource={a.resource} />
                {a.aiSuggested ? (
                  <span className={styles.ai} title="Confirmado desde un borrador de Tita">
                    <Badge tone="good">IA</Badge>
                  </span>
                ) : null}
              </span>
              <span className={styles.id}>#{a.id}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
