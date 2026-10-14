import { Fragment, type CSSProperties } from "react";
import { dateTime, initials } from "@/lib/format";
import type { Audit } from "@/types/api";
import { METHOD_VERB, methodKind, pathSegments, splitDateTime } from "./auditMethod";
import styles from "./AuditTimeline.module.css";

const KIND_CLASS = { create: styles.kCreate, update: styles.kUpdate, remove: styles.kRemove, other: styles.kOther };

/** Ruta del recurso con los segmentos numéricos (identificadores) resaltados. */
export const ResourcePath = ({ resource, className }: { resource: string; className?: string }) => {
  const parts = pathSegments(resource);
  return (
    <code className={[styles.path, className ?? ""].join(" ")} title={resource}>
      {parts.length === 0 ? <span className={styles.slash}>/</span> : null}
      {parts.map((p, i) => (
        <Fragment key={i}>
          <span className={styles.slash}>/</span>
          <span className={p.id ? styles.segId : styles.seg}>{p.text}</span>
        </Fragment>
      ))}
    </code>
  );
};

/** Bitácora tipo terminal: riel vertical con un punto por escritura, coloreado según el método HTTP. */
export const AuditTimeline = ({ items }: { items: Audit[] }) => {
  let lastDay = "";
  return (
    <ol className={styles.log} aria-label="Escrituras registradas">
      {items.map((a, i) => {
        const { day, time } = splitDateTime(dateTime(a.createdAt));
        const newDay = day !== lastDay;
        lastDay = day;
        const kind = methodKind(a.method);
        return (
          <li key={a.id} className={[styles.entry, KIND_CLASS[kind]].join(" ")} style={{ "--i": i } as CSSProperties}>
            {newDay ? (
              <div className={styles.day}>
                <span className={styles.dayText}>{day}</span>
              </div>
            ) : null}
            <div className={styles.row}>
              <time className={styles.time} dateTime={a.createdAt}>
                {time}
              </time>
              <span className={styles.node} aria-hidden="true" />
              <div className={styles.line}>
                <span className={styles.method}>{a.method.toUpperCase()}</span>
                <span className={styles.who}>
                  <span className={styles.mini} aria-hidden="true">
                    {initials(a.username, a.username.slice(1))}
                  </span>
                  <span className={styles.user}>{a.username}</span>
                  <span className={styles.verb}>{METHOD_VERB[kind]}</span>
                </span>
                <ResourcePath resource={a.resource} />
                <span className={styles.id}>#{a.id}</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};
