import { useEffect, useState } from "react";
import { useAudits } from "@/hooks/audits";
import { useUsers } from "@/hooks/users";
import { int } from "@/lib/format";
import { PageHeader } from "@/components/layout/AppShell";
import { Odometer, TopoField } from "@/components/motion";
import { Button, EmptyState, Input, Pagination, QueryState, Select } from "@/components/ui";
import type { AuditQuery } from "@/types/api";
import { METHOD_LEGEND } from "./auditMethod";
import { AuditTimeline } from "./AuditTimeline";
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

const KIND_CLASS = { create: styles.kCreate, update: styles.kUpdate, remove: styles.kRemove };

/** CU-18 Auditoría de escrituras (solo ADMIN): bitácora en vivo con barra de comandos para filtrar. */
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

      <section className={styles.terminal} aria-labelledby="audit-log-title">
        <TopoField className={styles.topo} rings={10} signal={5} seed={4.2} />

        <header className={styles.head}>
          <div className={styles.headText}>
            <div className={styles.label}>
              <span className={styles.live} aria-hidden="true" />
              Bitácora en vivo · solo escrituras
            </div>
            <h2 id="audit-log-title" className={styles.title}>
              Cada cambio deja <em>rastro</em>
            </h2>
            <p className={styles.lead}>Solo se auditan POST, PUT y DELETE; las consultas no dejan rastro.</p>
          </div>
          <div className={styles.counter}>
            <span className={styles.count}>{query.data ? <Odometer value={int(query.data.count)} /> : "—"}</span>
            <span className={styles.countLabel}>{hasFilters ? "escrituras con estos filtros" : "escrituras registradas"}</span>
          </div>
        </header>

        <div className={styles.command} role="search" aria-label="Filtros de la auditoría">
          <span className={styles.prompt} aria-hidden="true">
            ›
          </span>
          <label className={styles.cmdField}>
            <span className={styles.cmdKey}>usuario</span>
            <Select
              className={styles.control}
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
          </label>
          <label className={[styles.cmdField, styles.cmdGrow].join(" ")}>
            <span className={styles.cmdKey}>recurso</span>
            <Input
              className={styles.control}
              placeholder="/sales o /products/12"
              value={resource}
              onChange={(e) => {
                setResource(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className={styles.cmdField}>
            <span className={styles.cmdKey}>desde</span>
            <Input
              className={styles.control}
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className={styles.cmdField}>
            <span className={styles.cmdKey}>hasta</span>
            <Input
              className={styles.control}
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        <div className={styles.legendRow}>
          <ul className={styles.legend} aria-label="Colores por método">
            {METHOD_LEGEND.map((m) => (
              <li key={m.kind} className={[styles.legendItem, KIND_CLASS[m.kind]].join(" ")}>
                <span className={styles.legendDot} aria-hidden="true" />
                {m.method} <span className={styles.legendLabel}>{m.label}</span>
              </li>
            ))}
          </ul>
          {query.data && query.data.pages > 1 ? (
            <span className={styles.pageTag}>
              pág. {int(query.data.page)} / {int(query.data.pages)}
            </span>
          ) : null}
        </div>

        <div className={styles.screen}>
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
                <AuditTimeline key={data.page} items={data.items} />
                <div className={styles.eof} aria-hidden="true">
                  <span>fin de la página</span>
                  <span className={styles.caret} />
                </div>
                <Pagination page={data} onPage={setPage} />
              </>
            )}
          </QueryState>
        </div>
      </section>
    </div>
  );
};
