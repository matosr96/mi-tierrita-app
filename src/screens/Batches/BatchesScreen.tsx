import { useState } from "react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Card, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { useExpiringBatches } from "@/hooks/batches";
import { dateOnly, int, money } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import type { ProductBatch } from "@/types/api";
import { ExpiryBadge } from "./ExpiryBadge";
import { AdminBatchStats } from "./AdminBatchStats";
import { WindowBatchStats } from "./WindowBatchStats";
import { DistributionCard } from "./DistributionCard";
import { RegisterBatchModal } from "./RegisterBatchModal";
import styles from "./BatchesScreen.module.css";

const WINDOWS = [7, 15, 30, 60, 90].map((d) => ({ value: d, label: `${d} días` }));

const columns: Column<ProductBatch>[] = [
  { key: "product", header: "Producto", render: (b) => <span className={styles.product}>{b.productName}</span> },
  { key: "supplier", header: "Proveedor", align: "left", render: (b) => b.supplierName ?? <span className="muted">—</span> },
  { key: "lot", header: "Lote", align: "left", render: (b) => <span className={styles.lot}>#{b.id}</span> },
  { key: "expires", header: "Vence", align: "left", render: (b) => dateOnly(b.expiresAt) },
  { key: "days", header: "Restan", align: "left", render: (b) => <ExpiryBadge batch={b} /> },
  { key: "remaining", header: "Cant.", align: "right", render: (b) => `${int(b.quantityRemaining)} / ${int(b.quantity)}` },
  { key: "cost", header: "Costo unit.", align: "right", render: (b) => money(b.unitCost) },
];

const AlertIcon = () => (
  <svg className={styles.alertIcon} width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="4.8" x2="8" y2="8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="8" cy="11.3" r="0.9" fill="currentColor" />
  </svg>
);

/** CU-07 Lotes y vencimientos: control FEFO, el más próximo a vencer sale primero. */
export const BatchesScreen = () => {
  const isAdmin = useSessionStore((s) => s.user?.role === "ADMIN");
  const [days, setDays] = useState(30);
  const [registerOpen, setRegisterOpen] = useState(false);
  const query = useExpiringBatches({ days, limit: 100 });

  const items = query.data?.items ?? [];
  const expired = items.filter((b) => b.expired).length;
  const upcoming = items.length - expired;

  return (
    <>
      <PageHeader
        title="Lotes y vencimientos"
        subtitle={isAdmin ? "Control FEFO: primero en vencer, primero en salir." : "Primero en vencer, primero en salir."}
        actions={<Button onClick={() => setRegisterOpen(true)}>Registrar lote</Button>}
      />

      {query.data !== undefined && expired > 0 ? (
        <div className={styles.alert} role="status">
          <AlertIcon />
          <span>
            <strong>
              {int(expired)} {expired === 1 ? "lote vencido" : "lotes vencidos"} en bodega.
            </strong>{" "}
            {isAdmin ? "Retírelos del estante: una venta nunca los descuenta." : "Retírelos del estante y avise al administrador."}
          </span>
        </div>
      ) : query.data !== undefined && upcoming > 0 ? (
        <div className={[styles.alert, days > 30 ? styles.alertWarn : ""].join(" ")} role="status">
          <AlertIcon />
          <span>
            <strong>
              {int(upcoming)} {upcoming === 1 ? "lote vence" : "lotes vencen"} dentro de {days} días.
            </strong>{" "}
            {isAdmin ? "Aplique FEFO: primero en vencer, primero en salir." : "Póngalos al frente del estante para que salgan primero."}
          </span>
        </div>
      ) : null}

      {isAdmin ? <AdminBatchStats days={days} /> : <WindowBatchStats days={days} query={query} />}

      <div className={styles.filters}>
        <span className={styles.filtersLabel}>Ventana</span>
        <Chips options={WINDOWS} value={days} onChange={setDays} />
      </div>

      <div className={styles.grid}>
        <Card title="Lotes por orden de vencimiento" subtitle={isAdmin ? "El más próximo a vencer sale primero" : "El más próximo sale primero"}>
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

        <DistributionCard
          days={days}
          query={query}
          note={
            isAdmin
              ? "FEFO es más apropiado que FIFO en productos con vencimiento: el orden de entrada no coincide con el de vencimiento."
              : "El orden de entrada no coincide con el de vencimiento: por eso se ordena por fecha de vencimiento y no por llegada."
          }
        />
      </div>

      <RegisterBatchModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </>
  );
};
