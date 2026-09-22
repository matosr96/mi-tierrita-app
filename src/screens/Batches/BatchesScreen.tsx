import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Callout, Card, Chips, DataTable, EmptyState, QueryState, StatCard, StatGrid, type Column } from "@/components/ui";
import { VBarChart } from "@/components/charts";
import { useExpiringBatches } from "@/hooks/batches";
import { dateOnly, int, money } from "@/lib/format";
import type { ProductBatch } from "@/types/api";
import { ExpiryBadge } from "./ExpiryBadge";
import { RegisterBatchModal } from "./RegisterBatchModal";
import styles from "./BatchesScreen.module.css";

const WINDOWS = [7, 15, 30, 60, 90].map((d) => ({ value: d, label: `${d} días` }));

const columns: Column<ProductBatch>[] = [
  { key: "product", header: "Producto", render: (b) => <span className={styles.product}>{b.productName}</span> },
  { key: "supplier", header: "Proveedor", render: (b) => b.supplierName ?? <span className="muted">—</span> },
  { key: "lot", header: "Lote #", render: (b) => <span className={styles.lot}>#{b.id}</span> },
  { key: "expires", header: "Vence", render: (b) => dateOnly(b.expiresAt) },
  { key: "days", header: "Días", align: "center", render: (b) => <ExpiryBadge batch={b} /> },
  { key: "remaining", header: "Restante", align: "right", render: (b) => `${int(b.quantityRemaining)} / ${int(b.quantity)}` },
  { key: "cost", header: "Costo unitario", align: "right", render: (b) => money(b.unitCost) },
  { key: "value", header: "Valor restante", align: "right", render: (b) => money(b.quantityRemaining * b.unitCost) },
];

/** CU-07 Lotes y vencimientos: control FEFO, el más próximo a vencer sale primero. */
export const BatchesScreen = () => {
  const [days, setDays] = useState(30);
  const [registerOpen, setRegisterOpen] = useState(false);
  const query = useExpiringBatches({ days, limit: 100 });

  const items = query.data?.items ?? [];
  const expired = items.filter((b) => b.expired);
  const upcoming = items.filter((b) => !b.expired);
  const units = items.reduce((sum, b) => sum + b.quantityRemaining, 0);
  const partial = query.data !== undefined && query.data.count > items.length;
  const stat = (value: ReactNode): ReactNode => (query.isPending ? "…" : query.isError ? "—" : value);
  const windowHint = partial ? `en esta ventana (primeros ${int(items.length)} de ${int(query.data?.count)})` : "en esta ventana";

  const buckets = [
    { label: "Vencidos", value: expired.length, alt: true },
    { label: "0–7 días", value: upcoming.filter((b) => b.daysToExpire <= 7).length },
    ...(days > 7 ? [{ label: "8–30 días", value: upcoming.filter((b) => b.daysToExpire > 7 && b.daysToExpire <= 30).length }] : []),
    ...(days > 30 ? [{ label: `31–${days} días`, value: upcoming.filter((b) => b.daysToExpire > 30).length }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Lotes y vencimientos"
        subtitle="Primero en vencer, primero en salir."
        actions={<Button onClick={() => setRegisterOpen(true)}>Registrar lote</Button>}
      />

      {query.data !== undefined && expired.length > 0 ? (
        <Callout tone="bad">
          <strong>
            {int(expired.length)} {expired.length === 1 ? "lote vencido" : "lotes vencidos"} en bodega.
          </strong>{" "}
          Retírelos del estante y regístrelos con el administrador.
        </Callout>
      ) : query.data !== undefined && upcoming.length > 0 ? (
        <Callout tone="warn">
          <strong>
            {int(upcoming.length)} {upcoming.length === 1 ? "lote vence" : "lotes vencen"} dentro de {days} días.
          </strong>{" "}
          Aplique FEFO: póngalos al frente del estante para que salgan primero.
        </Callout>
      ) : null}

      <StatGrid>
        <StatCard label="Lotes vencidos" value={stat(int(expired.length))} hint={windowHint} tone={expired.length > 0 ? "bad" : "neutral"} />
        <StatCard label={`Por vencer en ${days} días`} value={stat(int(upcoming.length))} hint={windowHint} tone={upcoming.length > 0 ? "warn" : "neutral"} />
        <StatCard label="Unidades comprometidas" value={stat(int(units))} hint={`restantes ${windowHint}`} />
      </StatGrid>

      <div className={styles.filters}>
        <span className={styles.filtersLabel}>Ventana</span>
        <Chips options={WINDOWS} value={days} onChange={setDays} />
      </div>

      <div className={styles.grid}>
        <Card title="Lotes por orden de vencimiento" subtitle="El más próximo a vencer sale primero">
          <QueryState
            query={query}
            isEmpty={(page) => page.items.length === 0}
            empty={
              <EmptyState
                title={`No hay lotes que venzan en los próximos ${days} días`}
                text="Amplíe la ventana o registre la entrada de mercancía."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setRegisterOpen(true)}>
                    Registrar lote
                  </Button>
                }
              />
            }
          >
            {(page) => (
              <>
                <DataTable columns={columns} rows={page.items} rowKey={(b) => b.id} />
                {page.count > page.items.length ? (
                  <p className={styles.tableNote}>
                    Se muestran los {int(page.items.length)} lotes más próximos a vencer de {int(page.count)} en la ventana.
                  </p>
                ) : null}
              </>
            )}
          </QueryState>
        </Card>

        <Card title="Distribución" subtitle="Lotes por urgencia">
          {query.isPending ? (
            <p className="muted">Cargando…</p>
          ) : query.isError ? (
            <p className="muted">No disponible.</p>
          ) : items.length === 0 ? (
            <p className="muted">Sin lotes en la ventana seleccionada.</p>
          ) : (
            <>
              <VBarChart data={buckets} format={int} />
              <p className={styles.sideNote}>El orden de entrada no coincide con el de vencimiento: por eso se ordena por fecha de vencimiento y no por llegada.</p>
            </>
          )}
        </Card>
      </div>

      <RegisterBatchModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  );
};
