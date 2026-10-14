import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useSale, useVoidSale } from "@/hooks/sales";
import { Button, Callout, Modal, QueryState } from "@/components/ui";
import { dateTime, int, money } from "@/lib/format";
import styles from "./SaleDetailModal.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

/** Detalle de una venta (CU-10) impreso como un tiquete de caja, y anulación con confirmación (RF-03.4, solo ADMIN). */
export const SaleDetailModal = ({ id, onClose }: { id: number | null; onClose: () => void }) => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const sale = useSale(id);
  const voidSale = useVoidSale();
  const [confirming, setConfirming] = useState(false);

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
      <QueryState query={sale} empty={null}>
        {(s) => {
          const voided = s.status === "VOIDED";
          return (
            <div className={styles.stack}>
              <div className={styles.paperWrap}>
                <article className={[styles.receipt, voided ? styles.voided : ""].join(" ")} key={s.id} aria-label={`Tiquete de la factura ${s.invoiceNumber}`}>
                  <header className={styles.head}>
                    <span className={styles.brand}>Agropecuaria Mi Tierrita</span>
                    <span className={styles.kicker}>Factura de venta</span>
                    <span className={styles.invoice}>{s.invoiceNumber}</span>
                    <span className={styles.when}>{dateTime(s.createdAt)}</span>
                  </header>

                  <dl className={styles.facts}>
                    <div>
                      <dt>Cliente</dt>
                      <dd>{s.customerName ?? "Consumidor final"}</dd>
                    </div>
                    <div>
                      <dt>Registró</dt>
                      <dd>{s.username}</dd>
                    </div>
                    <div>
                      <dt>Pago</dt>
                      <dd>{PAYMENT_LABELS[s.paymentType]}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd className={voided ? styles.bad : styles.good}>{voided ? "Anulada" : "Completada"}</dd>
                    </div>
                    {voided ? (
                      <div>
                        <dt>Anulada el</dt>
                        <dd>{dateTime(s.voidedAt)}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className={styles.linesHead} aria-hidden="true">
                    <span>Artículo</span>
                    <span>Subtotal</span>
                  </div>
                  <ul className={styles.lines}>
                    {s.lines.map((l) => (
                      <li key={l.id} className={styles.line}>
                        <div className={styles.lineTop}>
                          <span className={styles.lineName}>{l.productName}</span>
                          <span className={styles.leader} aria-hidden="true" />
                          <span className={styles.lineTotal}>{money(l.lineTotal)}</span>
                        </div>
                        <div className={styles.lineSub}>
                          {l.sku} · {int(l.quantity)} × {money(l.unitPrice)}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className={styles.total}>
                    <span>Total</span>
                    <strong>{money(s.total)}</strong>
                  </div>

                  <div className={styles.barcode} aria-hidden="true" />
                  <p className={styles.thanks}>Gracias por su compra · conserve este tiquete</p>

                  {voided ? (
                    <span className={styles.stamp} aria-hidden="true">
                      Anulada
                    </span>
                  ) : null}
                </article>
              </div>

              {confirming ? (
                <Callout tone="warn">
                  Al anular, cada unidad vuelve a su lote de origen, se repone el stock y, si la venta fue a crédito, baja el saldo del cliente. La factura queda marcada como anulada; no se borra.
                </Callout>
              ) : null}
            </div>
          );
        }}
      </QueryState>
    </Modal>
  );
};
