import { useState } from "react";
import { Card, EmptyState, ErrorState, Loading } from "@/components/ui";
import { dateOnly, int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";
import { expiryText, expiryTone } from "./ExpiryBadge";
import styles from "./WarehouseCard.module.css";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
type Status = "expired" | "week" | "month" | "later";

/** Casillas del estante: 3 estantes × 3 niveles × 4 posiciones. */
const SLOTS = 36;

/** Tramo de color: los mismos umbrales de ExpiryBadge (vencido, 7 y 30 días), separando el vencido del crítico. */
const statusOf = (b: ProductBatch): Status => {
  if (b.expired) return "expired";
  const tone = expiryTone(b);
  return tone === "bad" ? "week" : tone === "warn" ? "month" : "later";
};

const STATUS: { key: Status; label: string; className: string | undefined }[] = [
  { key: "expired", label: "Vencido", className: styles.sExpired },
  { key: "week", label: "7 días o menos", className: styles.sWeek },
  { key: "month", label: "30 días o menos", className: styles.sMonth },
  { key: "later", label: "Más de 30 días", className: styles.sLater },
];
const statusClass = (s: Status): string => STATUS.find((x) => x.key === s)?.className ?? "";

/** Estante FEFO: cada casilla es un lote, de izquierda a derecha y de arriba abajo; la primera sale primero. */
export const WarehouseCard = ({ days, query }: { days: number; query: Query }) => {
  const [activeId, setActiveId] = useState<number | null>(null);

  const items = query.data?.items ?? [];
  const shown = items.slice(0, SLOTS);
  const hidden = query.data ? query.data.count - shown.length : 0;
  const counts = STATUS.map((s) => ({ ...s, value: items.filter((b) => statusOf(b) === s.key).length }));
  const first = shown[0];
  const active = shown.find((b) => b.id === activeId) ?? first;

  return (
    <Card title="Estante en orden de salida" subtitle="Cada casilla es un lote. Se lee de izquierda a derecha y de arriba abajo: la primera sale primero.">
      {query.isPending ? (
        <Loading inline text="Cargando lotes…" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Estantes libres" text={`Ningún lote vence en los próximos ${days} días.`} />
      ) : (
        <div className={styles.body}>
          <div className={styles.shelf}>
            <ol className={styles.grid} aria-label={`Estante con ${int(shown.length)} lotes en orden FEFO`}>
              {Array.from({ length: SLOTS }, (_, i) => {
                const b = shown[i];
                if (!b) return <li key={`empty-${i}`} className={styles.empty} aria-hidden="true" />;
                return (
                  <li
                    key={b.id}
                    tabIndex={0}
                    aria-label={`Posición ${i + 1}: ${b.productName}, lote ${b.id}, vence ${dateOnly(b.expiresAt)} (${expiryText(b)}), quedan ${int(b.quantityRemaining)} de ${int(b.quantity)} unidades`}
                    className={[styles.cell, statusClass(statusOf(b)), active?.id === b.id ? styles.cellActive : ""].join(" ")}
                    onPointerEnter={() => setActiveId(b.id)}
                    onFocus={() => setActiveId(b.id)}
                  >
                    #{b.id}
                  </li>
                );
              })}
            </ol>
            {hidden > 0 ? (
              <p className={styles.more}>
                {int(hidden)} {hidden === 1 ? "lote más" : "lotes más"} fuera del estante: se muestran los {int(shown.length)} primeros en salir.
              </p>
            ) : null}
          </div>

          <aside className={styles.aside}>
            <ul className={styles.legend}>
              {counts.map((c) => (
                <li key={c.key} className={[styles.legendItem, c.className].join(" ")}>
                  <span className={styles.swatch} aria-hidden="true" />
                  <span className={styles.legendLabel}>{c.label}</span>
                  <span className={styles.legendValue}>{int(c.value)}</span>
                </li>
              ))}
            </ul>
            {active ? (
              <div className={styles.detail} aria-live="polite">
                <div className={styles.detailLabel}>{active.id === first?.id ? "Siguiente en salir" : "Lote seleccionado"}</div>
                <div className={styles.detailProduct}>{active.productName}</div>
                <dl className={styles.detailRows}>
                  <dt>Lote</dt>
                  <dd className={styles.mono}>#{active.id}</dd>
                  <dt>Vence</dt>
                  <dd>
                    {dateOnly(active.expiresAt)} · {expiryText(active)}
                  </dd>
                  <dt>Restante</dt>
                  <dd>
                    {int(active.quantityRemaining)} / {int(active.quantity)} u.
                  </dd>
                </dl>
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </Card>
  );
};
