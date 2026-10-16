import { Link } from "react-router-dom";
import { Badge, Button } from "@/components/ui";
import { dateOnly, int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";
import styles from "./ExpiringPanel.module.css";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };

const toneOf = (b: ProductBatch) => (b.expired || b.daysToExpire <= 7 ? "bad" : "warn");
const dayText = (b: ProductBatch) => (b.expired ? "Vencido" : b.daysToExpire === 0 ? "Hoy" : b.daysToExpire === 1 ? "1 día" : `${int(b.daysToExpire)} días`);

/** Recepciones por vencer: tarjeta blanca con la cuenta de la API y la lista de lotes más próximos. */
export const ExpiringPanel = ({ days, query }: { days: number; query: Query }) => {
  const items = query.data?.items ?? [];
  const count = query.data?.count;

  return (
    <aside className={styles.panel} aria-labelledby="expiring-title">
      <header className={styles.head}>
        <h2 id="expiring-title" className={styles.title}>
          Recepciones por vencer
        </h2>
        <p className={styles.subtitle}>Lotes recibidos que vencen en los próximos {int(days)} días.</p>
      </header>

      <div className={styles.countRow}>
        <span className={[styles.count, count === 0 ? styles.countClear : count !== undefined ? styles.countWarn : ""].join(" ")}>{count !== undefined ? int(count) : "—"}</span>
        <span className={styles.countLabel}>{count === undefined ? (query.isError ? "No disponible" : "Revisando…") : count === 1 ? "lote por vencer" : "lotes por vencer"}</span>
      </div>

      {query.isPending ? (
        <p className={styles.state}>Cargando lotes…</p>
      ) : query.isError ? (
        <div className={styles.state}>
          <p>No se pudieron cargar los lotes.</p>
          <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className={styles.state}>Nada por vencer: ningún lote recibido vence en los próximos {int(days)} días.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((b) => (
            <li key={b.id} className={styles.item}>
              <span className={styles.what}>
                <span className={styles.product}>{b.productName}</span>
                <span className={styles.meta}>
                  {b.supplierName ?? "Sin proveedor"} · <span className={styles.code}>#{b.id}</span> · {dateOnly(b.expiresAt)}
                </span>
              </span>
              <span className={styles.side}>
                <Badge tone={toneOf(b)}>{dayText(b)}</Badge>
                <span className={styles.units}>{int(b.quantityRemaining)} u.</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link to="/lotes" className={styles.more}>
        {count !== undefined && count > items.length ? `Ver los ${int(count)} lotes` : "Ver lotes"} <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
};
