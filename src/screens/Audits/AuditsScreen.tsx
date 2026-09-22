import { useEffect, useState } from "react";
import { useAudits } from "@/hooks/audits";
import { useUsers } from "@/hooks/users";
import { dateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Badge, Button, Card, DataTable, EmptyState, Field, Input, Pagination, QueryState, Select, type Column } from "@/components/ui";
import type { Audit, AuditQuery } from "@/types/api";
import styles from "./AuditsScreen.module.css";

const PAGE_SIZE = 25;

const useDebounced = <T,>(value: T, ms: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
};

const methodTone = (method: string): "good" | "warn" | "bad" | "neutral" => {
  switch (method.toUpperCase()) {
    case "POST":
      return "good";
    case "PUT":
    case "PATCH":
      return "warn";
    case "DELETE":
      return "bad";
    default:
      return "neutral";
  }
};

const columns: Column<Audit>[] = [
  { key: "createdAt", header: "Fecha", width: "180px", render: (a) => <span className={styles.date}>{dateTime(a.createdAt)}</span> },
  { key: "username", header: "Usuario", width: "160px", render: (a) => <span className={styles.user}>{a.username}</span> },
  { key: "method", header: "Método", width: "110px", render: (a) => <Badge tone={methodTone(a.method)}>{a.method.toUpperCase()}</Badge> },
  { key: "resource", header: "Recurso", render: (a) => <span className={styles.mono}>{a.resource}</span> },
];

/** CU-18 Auditoría de escrituras (solo ADMIN). */
export const AuditsScreen = () => {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState("");
  const [resource, setResource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const debouncedResource = useDebounced(resource.trim(), 400);

  const users = useUsers({ limit: 100 });

  const filters: AuditQuery = {
    page,
    limit: PAGE_SIZE,
    ...(userId ? { userId: Number(userId) } : {}),
    ...(debouncedResource ? { resource: debouncedResource } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const query = useAudits(filters);
  const hasFilters = Boolean(userId || resource || from || to);

  const clear = () => {
    setUserId("");
    setResource("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Auditoría" subtitle="Registro de escrituras: quién hizo qué, cuándo y sobre qué recurso." />

      <Card>
        <div className={styles.filters}>
          <Field label="Usuario" htmlFor="audit-user">
            <Select
              id="audit-user"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {(users.data?.items ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} · {u.username}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Recurso" htmlFor="audit-resource" hint="Por ejemplo /sales o /products/12">
            <Input
              id="audit-resource"
              placeholder="Ruta del recurso"
              value={resource}
              onChange={(e) => {
                setResource(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Desde" htmlFor="audit-from">
            <Input
              id="audit-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Hasta" htmlFor="audit-to">
            <Input
              id="audit-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          {hasFilters ? (
            <div className={styles.filterActions}>
              <Button variant="ghost" onClick={clear}>
                Limpiar filtros
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Escrituras registradas" subtitle="Solo se auditan POST, PUT y DELETE; las consultas no dejan rastro." flush>
        <QueryState
          query={query}
          isEmpty={(data) => data.items.length === 0}
          empty={
            <EmptyState
              title="No hay escrituras registradas con esos filtros"
              text={hasFilters ? "Pruebe con otro usuario, recurso o rango de fechas." : "Las escrituras aparecerán aquí a medida que el equipo use el sistema."}
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clear}>
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
            />
          }
        >
          {(data) => (
            <>
              <DataTable columns={columns} rows={data.items} rowKey={(a) => a.id} />
              <div className={styles.pager}>
                <Pagination page={data} onPage={setPage} />
              </div>
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
};
