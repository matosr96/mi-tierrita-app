import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Chips, EmptyState, Pagination, QueryState } from "@/components/ui";
import { useContactMessages, useSetContactStatus } from "@/hooks/contact";
import { dateTime, int } from "@/lib/format";
import type { ContactMessage, ContactStatus } from "@/types/api";
import styles from "./ContactsScreen.module.css";

type Filter = "open" | ContactStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "NEW", label: "Por atender" },
  { value: "open", label: "Todos" },
  { value: "READ", label: "Atendidos" },
  { value: "ARCHIVED", label: "Archivados" },
];
const STATUS: Record<ContactStatus, { label: string; tone: "warn" | "good" | "neutral" }> = {
  NEW: { label: "Por atender", tone: "warn" },
  READ: { label: "Atendido", tone: "good" },
  ARCHIVED: { label: "Archivado", tone: "neutral" },
};

/** Enlace para responder por WhatsApp (Colombia por defecto si el número no trae indicativo). */
const whatsappUrl = (phone: string, name: string): string => {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(`Hola ${name}, le escribimos de Agropecuaria Mi Tierrita sobre su mensaje.`)}`;
};

const Item = ({ m }: { m: ContactMessage }) => {
  const setStatus = useSetContactStatus();
  const st = STATUS[m.status];
  return (
    <article className={[styles.item, m.status === "NEW" ? styles.isNew : ""].join(" ")}>
      <header className={styles.itemHead}>
        <strong className={styles.name}>{m.name}</strong>
        <Badge tone={st.tone}>{st.label}</Badge>
        {m.topic ? <span className={styles.topic}>{m.topic}</span> : null}
        <time className={styles.date} dateTime={m.createdAt}>
          {dateTime(m.createdAt)}
        </time>
      </header>
      <p className={styles.body}>{m.body}</p>
      <footer className={styles.itemFoot}>
        <div className={styles.channels}>
          {m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : null}
          {m.phone ? (
            <a href={whatsappUrl(m.phone, m.name)} target="_blank" rel="noreferrer">
              {m.phone} · WhatsApp
            </a>
          ) : null}
        </div>
        <div className={styles.actions}>
          {m.status === "NEW" ? (
            <Button size="sm" variant="secondary" loading={setStatus.isPending} onClick={() => setStatus.mutate({ id: m.id, status: "READ" })}>
              Marcar atendido
            </Button>
          ) : null}
          {m.status !== "ARCHIVED" ? (
            <Button size="sm" variant="ghost" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: m.id, status: "ARCHIVED" })}>
              Archivar
            </Button>
          ) : (
            <Button size="sm" variant="ghost" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: m.id, status: "NEW" })}>
              Volver a por atender
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
};

/** Contactos del sitio (prototipo 12): mensajes que dejan clientes y visitantes en el formulario de la página pública. */
export const ContactsScreen = () => {
  const [filter, setFilter] = useState<Filter>("NEW");
  const [page, setPage] = useState(1);
  const query = useContactMessages({ page, limit: 10, ...(filter === "open" ? {} : { status: filter }) });
  const pending = useContactMessages({ status: "NEW", limit: 1 });
  const subtitle =
    pending.data === undefined ? "Mensajes que dejan clientes y visitantes en el formulario de la página pública." : `Mensajes del formulario de la página pública · ${int(pending.data.count)} por atender.`;

  return (
    <>
      <PageHeader title="Contactos del sitio" subtitle={subtitle} />
      <div className={styles.bar}>
        <Chips
          options={FILTERS}
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
        />
      </div>
      <QueryState
        query={query}
        isEmpty={(p) => p.items.length === 0}
        empty={<EmptyState title={filter === "NEW" ? "Nada por atender" : "Sin mensajes"} text="Cuando alguien escriba desde la página pública, su mensaje llegará aquí." />}
      >
        {(p) => (
          <div className={styles.list}>
            {p.items.map((m) => (
              <Item key={m.id} m={m} />
            ))}
            <Pagination page={p} onPage={setPage} />
          </div>
        )}
      </QueryState>
    </>
  );
};
