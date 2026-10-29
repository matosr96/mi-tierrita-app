import { useState } from "react";
import { Badge, Button, Callout, EmptyState, Field, Input, Modal, QueryState } from "@/components/ui";
import { useAdjustmentPreview, useApplyStockCount } from "@/hooks/stock-counts";
import { dateOnly, int, money, todayIso } from "@/lib/format";
import type { ApiError } from "@/lib/errors";
import type { AdjustmentPreview } from "@/types/api";
import { plural, signed } from "./stockCountLabels";
import styles from "./StockCountsScreen.module.css";

type Props = { id: number; onClose: () => void };

/** Mensajes por producto del 713 (`details: [{ path: "expiresAt.<productId>", productId, message }]`) y de un 400. */
const expiryErrors = (err: ApiError | null): Record<number, string> => {
  if (!err || (err.code !== "713" && err.code !== "400") || !Array.isArray(err.details)) return {};
  const out: Record<number, string> = {};
  for (const d of err.details as { path?: string; productId?: number; message?: string }[]) {
    const pid = d.productId ?? Number(d.path?.split(".")[1]);
    if (Number.isFinite(pid) && d.message && out[pid] === undefined) out[pid] = d.message;
  }
  return out;
};

/**
 * Revisión del ajuste (solo ADMIN): faltantes con los lotes de los que saldrían y sobrantes con la fecha de vencimiento
 * del lote de ajuste, todo contra el stock actual que calcula la API. «Aplicar ajuste» pide una confirmación.
 */
export const AdjustmentPreviewModal = ({ id, onClose }: Props) => {
  const preview = useAdjustmentPreview(id);
  const apply = useApplyStockCount();
  const [expiries, setExpiries] = useState<Record<number, string>>({});
  const [missing, setMissing] = useState<Record<number, string>>({});
  const [confirming, setConfirming] = useState(false);
  const serverErrors = expiryErrors(apply.error);
  const errors = { ...serverErrors, ...missing };
  const generalError = apply.error && Object.keys(serverErrors).length === 0 ? apply.error.message : null;

  const askConfirm = (data: AdjustmentPreview) => {
    const next: Record<number, string> = {};
    for (const line of data.lines) if (line.needsExpiry && !expiries[line.productId]) next[line.productId] = "Indique la fecha de vencimiento.";
    setMissing(next);
    if (Object.keys(next).length === 0) setConfirming(true);
  };

  const doApply = (data: AdjustmentPreview) => {
    const surplusLots = data.lines.filter((l) => l.needsExpiry).map((l) => ({ productId: l.productId, expiresAt: expiries[l.productId] ?? "" }));
    apply.mutate(
      { id, surplusLots },
      {
        onSuccess: onClose,
        onError: () => setConfirming(false),
      },
    );
  };

  const shortages = preview.data?.lines.filter((l) => l.kind === "SHORTAGE") ?? [];
  const surpluses = preview.data?.lines.filter((l) => l.kind === "SURPLUS") ?? [];
  const blocked = shortages.some((l) => l.exceedsStock);

  return (
    <Modal
      open
      wide
      title={confirming ? "Confirmar el ajuste" : "Revisar y aplicar ajuste"}
      description="Las diferencias se calculan contra el stock físico de este momento, no contra el del inicio del conteo."
      onClose={onClose}
      footer={
        preview.data ? (
          confirming ? (
            <>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={apply.isPending}>
                Volver
              </Button>
              <Button loading={apply.isPending} onClick={() => preview.data && doApply(preview.data)}>
                Sí, aplicar ajuste
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={onClose}>
                Cerrar
              </Button>
              <Button disabled={blocked} onClick={() => preview.data && askConfirm(preview.data)}>
                Aplicar ajuste
              </Button>
            </>
          )
        ) : undefined
      }
    >
      <QueryState query={preview} empty={null}>
        {(data) =>
          confirming ? (
            <div className={styles.form}>
              <p className={styles.confirmText}>
                {data.lines.length === 0
                  ? "No hay faltantes ni sobrantes contra el stock actual: el conteo solo se cierra como aplicado."
                  : `Se descontarán ${plural(data.summary.shortageUnits, "unidad", "unidades")} de ${plural(data.summary.shortageLines, "producto", "productos")} y se crearán lotes de ajuste con ${plural(data.summary.surplusUnits, "unidad", "unidades")} de ${plural(data.summary.surplusLines, "producto", "productos")}.`}{" "}
                El conteo queda aplicado y no se puede deshacer.
              </p>
              {generalError ? <Callout tone="bad">{generalError}</Callout> : null}
            </div>
          ) : (
            <div className={styles.preview}>
              {data.summary.changedSinceStart > 0 ? (
                <Callout tone="warn" title="El stock cambió desde el inicio">
                  {data.summary.changedSinceStart === 1 ? "Un producto tuvo" : `${int(data.summary.changedSinceStart)} productos tuvieron`} ventas o entradas después de iniciar el conteo; el ajuste se calcula con el stock actual.
                </Callout>
              ) : null}
              {data.lines.length === 0 ? (
                <EmptyState title="El conteo cuadra con el stock actual" text="No hay faltantes ni sobrantes: al aplicar solo se cierra el conteo." />
              ) : null}

              {shortages.length > 0 ? (
                <section className={styles.previewGroup}>
                  <h3 className={styles.previewTitle}>
                    Faltantes · {plural(data.summary.shortageUnits, "unidad", "unidades")} en {plural(data.summary.shortageLines, "producto", "productos")}
                  </h3>
                  <ul className={styles.previewList}>
                    {shortages.map((l) => (
                      <li key={l.productId} className={styles.previewItem}>
                        <div className={styles.previewHead}>
                          <span className={styles.lineName}>{l.productName}</span>
                          <span className={[styles.previewDiff, styles.diffBad].join(" ")}>{signed(l.difference)}</span>
                        </div>
                        <span className={styles.lineMeta}>
                          <span className={styles.sku}>{l.sku}</span> · Contado {int(l.countedQuantity)} · Stock actual {int(l.currentStock)}
                          {l.stockChangedSinceStart ? ` · al iniciar ${int(l.expectedQuantity)}` : ""}
                        </span>
                        {l.exceedsStock ? (
                          <Callout tone="bad">El faltante es mayor que las unidades en lotes de este producto. Revise el inventario antes de aplicar.</Callout>
                        ) : (
                          <ul className={styles.deductions}>
                            {l.deductions.map((d) => (
                              <li key={d.productBatchId}>
                                <span className={styles.sku}>Lote #{d.productBatchId}</span> · vence {dateOnly(d.expiresAt)} {d.expired ? <Badge tone="bad">Vencido</Badge> : null} · −{int(d.quantity)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {surpluses.length > 0 ? (
                <section className={styles.previewGroup}>
                  <h3 className={styles.previewTitle}>
                    Sobrantes · {plural(data.summary.surplusUnits, "unidad", "unidades")} en {plural(data.summary.surplusLines, "producto", "productos")}
                  </h3>
                  <ul className={styles.previewList}>
                    {surpluses.map((l) => (
                      <li key={l.productId} className={styles.previewItem}>
                        <div className={styles.previewHead}>
                          <span className={styles.lineName}>{l.productName}</span>
                          <span className={[styles.previewDiff, styles.diffWarn].join(" ")}>{signed(l.difference)}</span>
                        </div>
                        <span className={styles.lineMeta}>
                          <span className={styles.sku}>{l.sku}</span> · Contado {int(l.countedQuantity)} · Stock actual {int(l.currentStock)}
                          {l.stockChangedSinceStart ? ` · al iniciar ${int(l.expectedQuantity)}` : ""} · Costo del lote {l.lastUnitCost === null ? "precio de compra vigente" : money(l.lastUnitCost)}
                        </span>
                        <Field label="Vencimiento del lote de ajuste" htmlFor={`expiry-${l.productId}`} error={errors[l.productId]}>
                          <Input
                            id={`expiry-${l.productId}`}
                            type="date"
                            min={todayIso()}
                            value={expiries[l.productId] ?? ""}
                            invalid={errors[l.productId] !== undefined}
                            onChange={(e) => {
                              const value = e.target.value;
                              setExpiries((prev) => ({ ...prev, [l.productId]: value }));
                              setMissing((prev) => {
                                const { [l.productId]: _drop, ...rest } = prev;
                                return rest;
                              });
                            }}
                          />
                        </Field>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {data.summary.unchangedLines > 0 ? <p className={styles.sheetMeta}>{data.summary.unchangedLines === 1 ? "Un producto cuadra" : `${int(data.summary.unchangedLines)} productos cuadran`} con el stock actual y no se toca{data.summary.unchangedLines === 1 ? "" : "n"}.</p> : null}
              {generalError ? <Callout tone="bad">{generalError}</Callout> : null}
            </div>
          )
        }
      </QueryState>
    </Modal>
  );
};
