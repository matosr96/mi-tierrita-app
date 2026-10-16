import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeroHeader } from "@/components/layout/HeroHeader";
import {
  Button,
  Card,
  DataTable,
  EmptyState,
  QueryState,
  StatGrid,
  type Column,
} from "@/components/ui";
import { useExpiringBatches } from "@/hooks/batches";
import { useProducts } from "@/hooks/products";
import { HBarChart } from "@/components/charts";
import { dateOnly, int, longToday } from "@/lib/format";
import type { Product, ProductBatch, User } from "@/types/api";
import { ExpiryBadge } from "@/screens/Batches/ExpiryBadge";
import { RegisterBatchModal } from "@/screens/Batches/RegisterBatchModal";
import { QueryStat } from "./QueryStat";
import { statusTitle, greetingFor } from "./homeDates";
import { todoItems } from "./attention";
import { LOW_STOCK } from "@/screens/Inventory/stockStatus";
import { StatusAside } from "./StatusAside";
import styles from "./HomeScreen.module.css";

const EXPIRING_DAYS = 30;

const batchColumns: Column<ProductBatch>[] = [
  {
    key: "product",
    header: "Producto",
    render: (b) => <span className={styles.strong}>{b.productName}</span>,
  },
  {
    key: "lot",
    header: "Lote",
    align: "left",
    render: (b) => <span className="muted">#{b.id}</span>,
  },
  {
    key: "expires",
    header: "Vence",
    align: "left",
    render: (b) => dateOnly(b.expiresAt),
  },
  {
    key: "days",
    header: "Restan",
    align: "left",
    render: (b) => <ExpiryBadge batch={b} />,
  },
  {
    key: "remaining",
    header: "Cant.",
    align: "right",
    render: (b) => int(b.quantityRemaining),
  },
];

/** Inicio de bodega (BodInicio del lienzo): qué reponer, qué sacar al frente y los lotes más próximos a vencer. */
export const WarehouseHome = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [registerOpen, setRegisterOpen] = useState(false);
  const products = useProducts({ limit: 100, active: true });
  const expiring = useExpiringBatches({ days: EXPIRING_DAYS, limit: 100 });

  const outOfStock = (items: Product[]) =>
    items.filter((p) => p.stock === 0).length;
  const expired = (items: ProductBatch[]) =>
    items.filter((b) => b.expired).length;
  const upcoming = (items: ProductBatch[]) =>
    items.filter((b) => !b.expired).length;
  const loadingTodo = products.isPending || expiring.isPending;
  const attention = loadingTodo
    ? null
    : todoItems(expiring.data?.items ?? [], products.data?.items ?? []);
  // Total de pendientes (la lista muestra a lo sumo dos por tipo): se cuentan los elementos que trae la API.
  const attentionTotal =
    (expiring.data?.items.length ?? 0) +
    (products.data?.items.filter((p) => p.stock === 0 || p.stock < LOW_STOCK)
      .length ?? 0);
  // La ventana de la API incluye los vencidos: se nombran aparte para no llamarlos "por vencer".
  const subtitle = expiring.data
    ? `${longToday()} · ${int(upcoming(expiring.data.items))} ${upcoming(expiring.data.items) === 1 ? "lote por vencer" : "lotes por vencer"} en ${EXPIRING_DAYS} días${
        expired(expiring.data.items) > 0 ? ` · ${int(expired(expiring.data.items))} ${expired(expiring.data.items) === 1 ? "vencido" : "vencidos"}` : ""
      }`
    : longToday();

  return (
    <>
      <HeroHeader
        eyebrow="Bodega y vencimientos"
        title={greetingFor(user.firstName)}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate("/inventario")}>
              Ver inventario
            </Button>
            <Button onClick={() => setRegisterOpen(true)}>
              Entrada de mercancía
            </Button>
          </>
        }
      />

      <StatGrid>
        <QueryStat
          query={products}
          label="Sin existencias"
          value={(p) => int(outOfStock(p.items))}
          hint={() => "productos por reponer"}
          tone={(p) => (outOfStock(p.items) > 0 ? "bad" : "neutral")}
        />
        <QueryStat
          query={expiring}
          label="Lotes por vencer"
          value={(p) => int(upcoming(p.items))}
          hint={() => `en los próximos ${EXPIRING_DAYS} días`}
          tone={(p) => (upcoming(p.items) > 0 ? "bad" : "neutral")}
        />
        <QueryStat
          query={expiring}
          label="Lotes vencidos"
          value={(p) => int(expired(p.items))}
          hint={(p) =>
            expired(p.items) > 0 ? "retirar del estante" : "ninguno en bodega"
          }
          tone={(p) => (expired(p.items) > 0 ? "bad" : "good")}
        />
        <QueryStat
          query={products}
          label="Productos activos"
          value={(p) => int(p.count)}
          hint={() => "en el catálogo"}
        />
      </StatGrid>

      <div className={styles.dash}>
        <StatusAside
          title={statusTitle(
            attention === null ? null : attentionTotal,
            user.firstName,
          )}
          items={attention}
          total={attentionTotal}
          to={"/lotes"}
          watches="los lotes vencidos o por vencer y los productos sin existencias o con pocas unidades"
        />
        <Card
          title="Existencias más bajas"
          subtitle={`Unidades en bodega · en naranja, menos de ${LOW_STOCK}`}
        >
          <QueryState
            query={products}
            isEmpty={(p) => p.items.length === 0}
            empty={<EmptyState title="Sin productos activos" />}
          >
            {(page) => {
              const low = [...page.items]
                .sort((a, b) => a.stock - b.stock)
                .slice(0, 7);
              return (
                <HBarChart
                  data={low.map((p) => ({
                    label: p.name,
                    value: p.stock,
                    alt: p.stock < LOW_STOCK,
                  }))}
                  format={(v) => `${int(v)} u`}
                  title="Productos con menos existencias"
                />
              );
            }}
          </QueryState>
        </Card>
        <Card
          title="Cuánto les queda a los lotes"
          subtitle={`Días para vencer · próximos ${EXPIRING_DAYS} días`}
        >
          <QueryState
            query={expiring}
            isEmpty={(p) => p.items.every((b) => b.expired)}
            empty={
              <EmptyState
                title="Ningún lote vence pronto"
                text={`No hay lotes que venzan en los próximos ${EXPIRING_DAYS} días.`}
              />
            }
          >
            {(page) => {
              const soon = page.items
                .filter((b) => !b.expired)
                .sort((a, b) => a.daysToExpire - b.daysToExpire)
                .slice(0, 7);
              return (
                <>
                  <HBarChart
                    data={soon.map((b) => ({
                      label: `${b.productName} · #${b.id}`,
                      value: b.daysToExpire,
                      alt: b.daysToExpire <= 7,
                    }))}
                    format={(v) => `${int(v)} d`}
                    title="Días para vencer de los lotes más próximos"
                  />
                  <p className={styles.note}>
                    En naranja, los que vencen esta semana: van al frente del
                    estante.
                  </p>
                </>
              );
            }}
          </QueryState>
        </Card>
      </div>

      <Card
        title="Lotes por orden de vencimiento"
        subtitle="Vencidos y próximos a vencer · los más urgentes primero"
      >
        <QueryState
          query={expiring}
          isEmpty={(p) => p.items.length === 0}
          empty={
            <EmptyState
              title={`Ningún lote vence en los próximos ${EXPIRING_DAYS} días`}
            />
          }
        >
          {(page) => (
            <>
              <DataTable
                columns={batchColumns}
                rows={page.items.slice(0, 5)}
                rowKey={(b) => b.id}
                onRowClick={() => navigate("/lotes")}
              />
              {page.count > 5 ? (
                <p className={styles.note}>
                  Los 5 más próximos de {int(page.count)}. Sáquelos al frente
                  del estante.
                </p>
              ) : null}
            </>
          )}
        </QueryState>
      </Card>

      <RegisterBatchModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />
    </>
  );
};
