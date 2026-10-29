import { useRecordHistory } from "@/hooks/audits";
import { useSessionStore } from "@/stores/session";
import { Badge, EmptyState, QueryState } from "@/components/ui";
import { dateTime, int } from "@/lib/format";
import { METHOD_VERB, methodKind } from "@/screens/Audits/auditMethod";
import type { Audit } from "@/types/api";
import styles from "./RecordHistory.module.css";

type Props = { entity: string; entityId: number };

const TONE = { create: "good", update: "warn", remove: "bad", other: "neutral" } as const;
const KIND_LABEL = { create: "alta", update: "cambio", remove: "baja", other: "otro" } as const;
const MAX_FIELDS = 14;

/** Un valor del detalle tal como se muestra: escalares en texto, listas y objetos compactos. */
const show = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "sí" : "no";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `${int(value.length)} ${value.length === 1 ? "elemento" : "elementos"}`;
  return JSON.stringify(value);
};

const Fields = ({ title, data }: { title: string; data: Record<string, unknown> | undefined }) => {
  if (!data) return null;
  const entries = Object.entries(data).slice(0, MAX_FIELDS);
  if (entries.length === 0) return null;
  return (
    <div className={styles.fields}>
      <span className={styles.fieldsTitle}>{title}</span>
      <dl className={styles.dl}>
        {entries.map(([k, v]) => (
          <div key={k} className={styles.field}>
            <dt>{k}</dt>
            <dd>{show(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const Entry = ({ a }: { a: Audit }) => {
  const kind = methodKind(a.method);
  const action = a.resource.split("/").filter(Boolean).slice(-1)[0];
  const sub = action !== undefined && !/^\d+$/.test(action) && action !== a.entity ? action : null;
  return (
    <li className={styles.entry}>
      <span className={styles.dot} data-kind={kind} aria-hidden="true" />
      <div className={styles.card}>
        <header className={styles.head}>
          <Badge tone={TONE[kind]}>{KIND_LABEL[kind]}</Badge>
          <span className={styles.sentence}>
            <strong>{a.username}</strong> {METHOD_VERB[kind]}
            {sub ? <code className={styles.sub}>{sub}</code> : null}
            {a.aiSuggested ? (
              <span title="Confirmado desde un borrador de Tita">
                <Badge tone="good">IA</Badge>
              </span>
            ) : null}
          </span>
          <time className={styles.when} dateTime={a.createdAt}>
            {dateTime(a.createdAt)}
          </time>
        </header>
        {a.changes ? (
          <>
            <Fields title="Datos enviados" data={a.changes.request} />
            <Fields title="Resultado" data={a.changes.response} />
          </>
        ) : (
          <p className={styles.noDetail}>Sin detalle del cambio.</p>
        )}
      </div>
    </li>
  );
};

/** Línea de tiempo de un registro (brief 33): quién, cuándo y qué cambió. Solo la ve la administración. */
export const RecordHistory = ({ entity, entityId }: Props) => {
  const role = useSessionStore((s) => s.user?.role);
  const isAdmin = role === "ADMIN";
  const history = useRecordHistory(entity, entityId, { enabled: isAdmin });
  if (!isAdmin) return null;
  return (
    <section className={styles.panel} aria-label="Historial de cambios">
      <QueryState query={history} isEmpty={(d) => d.items.length === 0} empty={<EmptyState title="Sin cambios registrados" text="Las escrituras sobre este registro aparecerán aquí con quién las hizo y qué cambió." />}>
        {(data) => (
          <>
            <ol className={styles.timeline}>
              {data.items.map((a) => (
                <Entry key={a.id} a={a} />
              ))}
            </ol>
            {data.count > data.items.length ? (
              <p className={styles.note}>
                Se muestran {int(data.items.length)} de {int(data.count)} cambios.
              </p>
            ) : null}
          </>
        )}
      </QueryState>
    </section>
  );
};
