import { useEffect, useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useSale, useVoidSale } from "@/hooks/sales";
import { Badge, Button, Callout, Modal, QueryState, Tabs } from "@/components/ui";
import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { RecordHistory } from "@/components/audits/RecordHistory";
import { dateTime, int, money } from "@/lib/format";
import { PersonName } from "@/components/people/PersonName";
import styles from "./SaleDetailModal.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

/** Pestañas del detalle: factura, comentarios de la venta y, para la administración, su historial de cambios (brief 33). */
type Tab = "invoice" | "comments" | "history";

/** Detalle de una venta (CU-10) con sus líneas y total, y anulación con confirmación (RF-03.4, solo ADMIN). */
export const SaleDetailModal = ({ id, onClose }: { id: number | null; onClose: () => void }) => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const sale = useSale(id);
  const voidSale = useVoidSale();
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState<Tab>("invoice");
  useEffect(() => setTab("invoice"), [id]);
  const tabs: { value: Tab; label: string }[] = [{ value: "invoice", label: "Factura" }, { value: "comments", label: "Comentarios" }, ...(isAdmin ? [{ value: "history" as const, label: "Historial" }] : [])];

  const close = () => {
    setConfirming(false);
    voidSale.reset();
    onClose();
  };
  const doVoid = async () => {
    if (id === null) return;
    await voidSale.mutateAsync(id).then(
      () => setConfirming(false),
      () => undefined,
    );
  };

  const canVoid = isAdmin && sale.data?.status === "COMPLETED";
  const footer = confirming ? (
    <>
      <Button variant="secondary" onClick={() => setConfirming(false)} disabled={voidSale.isPending}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={doVoid} loading={voidSale.isPending}>
        Sí, anular la venta
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={close}>
        Cerrar
      </Button>
      {canVoid ? (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Anular venta
        </Button>
      ) : null}
    </>
  );

  return (
    <Modal open={id !== null} title={sale.data ? `Factura ${sale.data.invoiceNumber}` : "Detalle de venta"} onClose={close} footer={footer}>
      <div className={styles.tabs}>
        <Tabs options={tabs} value={tab} onChange={setTab} ariaLabel="Secciones de la venta" />
      </div>
      {tab === "invoice" ? (
        <QueryState query={sale} empty={null}>
          {(s) => {
            const voided = s.status === "VOIDED";
            return (
              <div className={styles.stack}>
                <article className={[styles.receipt, voided ? styles.voided : ""].join(" ")} aria-label={`Detalle de la factura ${s.invoiceNumber}`}>
                  <header className={styles.head}>
                    <div className={styles.headText}>
                      <span className={styles.kicker}>Factura de venta</span>
                      <span className={styles.invoice}>{s.invoiceNumber}</span>
                      <span className={styles.when}>{dateTime(s.createdAt)}</span>
                    </div>
                    <Badge tone={voided ? "bad" : "good"}>{voided ? "Anulada" : "Completada"}</Badge>
                  </header>
  
                  <dl className={styles.facts}>
                    <div>
                      <dt>Cliente</dt>
                      <dd>{s.customerName ?? "Consumidor final"}</dd>
                    </div>
                    <div>
                      <dt>Registró</dt>
                      <dd>
                        <PersonName userId={s.userId}>{s.username}</PersonName>
                      </dd>
                    </div>
                    <div>
                      <dt>Pago</dt>
                      <dd>{PAYMENT_LABELS[s.paymentType]}</dd>
                    </div>
                    {voided ? (
                      <div>
                        <dt>Anulada el</dt>
                        <dd>{dateTime(s.voidedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>
  
                  <div className={styles.linesHead} aria-hidden="true">
                    <span>Producto</span>
                    <span>Subtotal</span>
                  </div>
                  <ul className={styles.lines}>
                    {s.lines.map((l) => (
                      <li key={l.id} className={styles.line}>
                        <div className={styles.lineMain}>
                          <span className={styles.lineName}>{l.productName}</span>
                          <span className={styles.lineSub}>
                            <span className={styles.sku}>{l.sku}</span> · {int(l.quantity)} × {money(l.unitPrice)}
                          </span>
                        </div>
                        <span className={styles.lineTotal}>{money(l.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
  
                  <div className={styles.total}>
                    <span>Total</span>
                    <strong>{money(s.total)}</strong>
                  </div>
                </article>
  
                {confirming ? (
                  <Callout tone="warn">
                    Al anular, cada unidad vuelve a su lote de origen, se repone el stock y, si la venta fue a crédito, baja el saldo del cliente. La factura queda marcada como anulada; no se borra.
                  </Callout>
                ) : null}
              </div>
            );
          }}
        </QueryState>
      ) : null}
      {tab === "comments" && id !== null ? <CommentsPanel entity="sales" entityId={id} /> : null}
      {tab === "history" && id !== null ? <RecordHistory entity="sales" entityId={id} /> : null}
    </Modal>
  );
};
