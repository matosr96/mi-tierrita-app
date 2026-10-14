import { useRef, useState, type CSSProperties } from "react";
import { TopoField } from "@/components/motion";
import { Button } from "@/components/ui";
import { dateOnly, int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";
import { expiryText, expiryTone } from "./ExpiryBadge";
import { paintOrder, racks, SLOTS, slots, VIEW_H, VIEW_W, type Prism } from "./warehouseGeometry";
import styles from "./WarehouseCard.module.css";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
type Status = "expired" | "week" | "month" | "later";
type Tip = { batch: ProductBatch; x: number; y: number; below: boolean };

/** Tramo de color: los mismos umbrales de ExpiryBadge (vencido, 7 y 30 días), separando el vencido del crítico. */
const statusOf = (b: ProductBatch): Status => {
  if (b.expired) return "expired";
  const tone = expiryTone(b);
  return tone === "bad" ? "week" : tone === "warn" ? "month" : "later";
};

const STATUS: { key: Status; label: string; className: string | undefined }[] = [
  { key: "expired", label: "Vencido", className: styles.sExpired },
  { key: "week", label: "≤ 7 días", className: styles.sWeek },
  { key: "month", label: "≤ 30 días", className: styles.sMonth },
  { key: "later", label: "Más de 30 días", className: styles.sLater },
];
const statusClass = (s: Status): string => STATUS.find((x) => x.key === s)?.className ?? "";

const Faces = ({ shape, className }: { shape: Prism; className?: string }) => (
  <g className={className}>
    <polygon points={shape.side} className={styles.side} />
    <polygon points={shape.front} className={styles.front} />
    <polygon points={shape.top} className={styles.top} />
  </g>
);

/** Bodega isométrica: cada caja es un lote, en orden FEFO de izquierda a derecha y de arriba abajo. */
export const WarehouseCard = ({ days, query }: { days: number; query: Query }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const items = query.data?.items ?? [];
  const shown = items.slice(0, SLOTS);
  const hidden = query.data ? query.data.count - shown.length : 0;
  const counts = STATUS.map((s) => ({ ...s, value: items.filter((b) => statusOf(b) === s.key).length }));
  const first = shown[0];

  const showTip = (el: Element, batch: ProductBatch) => {
    const stage = stageRef.current;
    if (!stage) return;
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const half = Math.min(110, s.width / 2);
    const x = Math.min(Math.max(r.left + r.width / 2 - s.left, half), s.width - half);
    const below = r.top - s.top < 120;
    setTip({ batch, x, y: below ? r.bottom - s.top + 10 : r.top - s.top - 10, below });
  };

  return (
    <section className={styles.card} aria-labelledby="warehouse-title">
      <TopoField className={styles.topo} rings={12} signal={7} seed={1.7} />
      <div className={styles.body}>
        <header className={styles.head}>
          <div className={styles.label}>Bodega · vista FEFO</div>
          <h2 id="warehouse-title" className={styles.title}>
            El estante en <em>orden de salida</em>
          </h2>
          <p className={styles.lead}>Cada caja es un lote. Se lee como un texto: de izquierda a derecha y de arriba abajo; la primera caja es la que sale primero.</p>
        </header>

        <div className={styles.stage} ref={stageRef}>
          <div className={styles.scroller} onScroll={() => setTip(null)}>
            <svg className={styles.svg} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="group" aria-label={`Bodega con ${int(shown.length)} lotes en orden FEFO`}>
              <defs>
                <pattern id="warehouse-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="5" className={styles.hatchLine} />
                </pattern>
              </defs>

              <g aria-hidden="true">
                {racks.map((rack, r) => (
                  <g key={r} className={styles.rack} style={{ "--r": r } as CSSProperties}>
                    <polygon points={rack.floor} className={styles.floor} pathLength={1} />
                    <polygon points={rack.back} className={styles.back} pathLength={1} />
                    {rack.backPosts.map((post, k) => (
                      <Faces key={k} shape={post} className={styles.post} />
                    ))}
                    {rack.planks.map((plank, k) => (
                      <g key={k} className={styles.plank} style={{ "--k": k } as CSSProperties}>
                        <Faces shape={plank} />
                      </g>
                    ))}
                  </g>
                ))}
                {slots.slice(shown.length).map((slot) => (
                  <polygon key={slot.index} points={slot.footprint} className={styles.emptySlot} />
                ))}
              </g>

              <g role="list" aria-label="Lotes en orden FEFO">
                {paintOrder
                  .filter((slot) => slot.index < shown.length)
                  .map((slot) => {
                    const b = shown[slot.index];
                    if (!b) return null;
                    const status = statusOf(b);
                    return (
                      <g
                        key={b.id}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Posición ${slot.index + 1}: ${b.productName}, lote ${b.id}, vence ${dateOnly(b.expiresAt)} (${expiryText(b)}), quedan ${int(b.quantityRemaining)} de ${int(b.quantity)} unidades`}
                        className={[styles.box, statusClass(status)].join(" ")}
                        style={{ "--i": slot.index } as CSSProperties}
                        onPointerEnter={(e) => showTip(e.currentTarget, b)}
                        onPointerLeave={() => setTip(null)}
                        onFocus={(e) => showTip(e.currentTarget, b)}
                        onBlur={() => setTip(null)}
                      >
                        <g className={styles.lift}>
                          <polygon points={slot.box.side} className={[styles.face, styles.side].join(" ")} />
                          <polygon points={slot.box.front} className={[styles.face, styles.front].join(" ")} />
                          {status === "expired" ? <polygon points={slot.box.front} className={styles.hatch} fill="url(#warehouse-hatch)" /> : null}
                          <polygon points={slot.box.top} className={[styles.face, styles.top].join(" ")} />
                          <text transform={slot.labelMatrix} className={styles.boxLabel}>
                            #{b.id}
                          </text>
                        </g>
                      </g>
                    );
                  })}
              </g>

              <g aria-hidden="true">
                {racks.map((rack, r) => (
                  <g key={r} className={styles.rack} style={{ "--r": r } as CSSProperties}>
                    {rack.frontPosts.map((post, k) => (
                      <Faces key={k} shape={post} className={styles.post} />
                    ))}
                  </g>
                ))}
                {first && slots[0] ? (
                  <g className={styles.firstMark} transform={`translate(${slots[0].anchor.x} ${slots[0].anchor.y - 26})`}>
                    <line x1="0" y1="8" x2="0" y2="20" className={styles.firstLine} />
                    <text x="0" y="2" className={styles.firstText}>
                      SALE PRIMERO
                    </text>
                  </g>
                ) : null}
              </g>
            </svg>
          </div>

          {query.isPending ? <p className={styles.overlay}>Cargando lotes…</p> : null}
          {query.isError ? (
            <div className={styles.overlay}>
              <p>No se pudieron cargar los lotes.</p>
              <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : null}
          {query.data !== undefined && items.length === 0 ? <p className={styles.overlay}>Estantes libres: ningún lote vence en los próximos {days} días.</p> : null}

          {tip ? (
            <div className={[styles.tip, tip.below ? styles.tipBelow : ""].join(" ")} style={{ left: tip.x, top: tip.y }} role="tooltip">
              <div className={styles.tipProduct}>{tip.batch.productName}</div>
              <dl className={styles.tipRows}>
                <dt>Lote</dt>
                <dd>#{tip.batch.id}</dd>
                <dt>Vence</dt>
                <dd>
                  {dateOnly(tip.batch.expiresAt)} <span className={[styles.tipBadge, statusClass(statusOf(tip.batch))].join(" ")}>{expiryText(tip.batch)}</span>
                </dd>
                <dt>Restante</dt>
                <dd>
                  {int(tip.batch.quantityRemaining)} / {int(tip.batch.quantity)} u.
                </dd>
              </dl>
            </div>
          ) : null}
        </div>

        <aside className={styles.aside}>
          <ul className={styles.legend}>
            {counts.map((c) => (
              <li key={c.key} className={[styles.legendItem, c.className].join(" ")}>
                <span className={styles.swatch} aria-hidden="true" />
                <span className={styles.legendLabel}>{c.label}</span>
                <span className={styles.legendValue}>{query.data ? int(c.value) : "—"}</span>
              </li>
            ))}
          </ul>
          {hidden > 0 ? (
            <p className={styles.more}>
              <strong>+{int(hidden)} lotes más</strong> fuera del estante: se muestran los {int(shown.length)} primeros en salir.
            </p>
          ) : null}
          {first ? (
            <p className={styles.next}>
              <span className={styles.nextLabel}>Siguiente en salir</span>
              {first.productName} · #{first.id} · {expiryText(first)}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
};
