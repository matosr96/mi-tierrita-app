import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Odometer, TopoField } from "@/components/motion";
import { Button } from "@/components/ui";
import { dateOnly, int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";
import styles from "./ExpiringPanel.module.css";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };

const toneOf = (b: ProductBatch) => (b.expired ? styles.expired : b.daysToExpire <= 7 ? styles.week : styles.month);
const dayText = (b: ProductBatch) => (b.expired ? "Vencido" : b.daysToExpire === 0 ? "Hoy" : b.daysToExpire === 1 ? "día" : "días");

/** Recepciones por vencer: tarjeta oscura con la cuenta en matriz de puntos, una regla 0→N días y la lista de lotes. */
export const ExpiringPanel = ({ days, query }: { days: number; query: Query }) => {
  const items = query.data?.items ?? [];
  const count = query.data?.count;

  return (
    <aside className={styles.panel} aria-labelledby="expiring-title">
      <TopoField className={styles.topo} rings={10} signal={3} seed={4.1} />
      <div className={styles.label}>Recepciones · próximos {int(days)} días</div>
      <h2 id="expiring-title" className={styles.title}>
        Lo recibido que <em>vence pronto</em>
      </h2>

      <div className={styles.countRow}>
        <span className={[styles.count, count === 0 ? styles.countClear : ""].join(" ")}>{count !== undefined ? <Odometer value={String(count).padStart(2, "0")} /> : "··"}</span>
        <span className={styles.countLabel}>{count === undefined ? (query.isError ? "No disponible" : "Revisando…") : count === 1 ? "lote por vencer" : "lotes por vencer"}</span>
      </div>

      {/* Regla 0 → N días: cada marca es un lote en su día de vencimiento (posición solo visual). */}
      <div className={styles.ruler} aria-hidden="true">
        <span className={styles.rulerLine} />
        {[0, 7, 15, days].map((d) => (
          <span key={d} className={styles.tick} style={{ left: `${(d / days) * 100}%` }}>
            <span>{d === 0 ? "hoy" : `${d}d`}</span>
          </span>
        ))}
        {items.map((b, i) => (
          <span key={b.id} className={[styles.pin, toneOf(b)].join(" ")} style={{ left: `${(Math.min(Math.max(b.daysToExpire, 0), days) / days) * 100}%`, "--lane": i % 3, "--i": i } as CSSProperties} />
        ))}
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
        <ol className={styles.list}>
          {items.map((b, i) => (
            <li key={b.id} className={[styles.item, toneOf(b)].join(" ")} style={{ "--i": i } as CSSProperties}>
              <span className={styles.days}>
                <span className={styles.daysNum}>{b.expired ? "××" : String(b.daysToExpire).padStart(2, "0")}</span>
                <span className={styles.daysUnit}>{dayText(b)}</span>
              </span>
              <span className={styles.what}>
                <span className={styles.product}>{b.productName}</span>
                <span className={styles.meta}>
                  {b.supplierName ?? "Sin proveedor"} · #{b.id} · {dateOnly(b.expiresAt)}
                </span>
              </span>
              <span className={styles.units}>
                {int(b.quantityRemaining)}
                <small>u.</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link to="/lotes" className={styles.more}>
        {count !== undefined && count > items.length ? `Ver los ${int(count)} lotes` : "Ver lotes"} <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
};
