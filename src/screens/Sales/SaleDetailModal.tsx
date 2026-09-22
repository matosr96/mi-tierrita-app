import { useState } from "react";
import { useSessionStore } from "@/stores/session";
import { useSale, useVoidSale } from "@/hooks/sales";
import { Badge, Button, Callout, DataTable, Modal, QueryState, type Column } from "@/components/ui";
import { dateTime, int, money } from "@/lib/format";
import type { SaleLine } from "@/types/api";
import styles from "./SalesScreen.module.css";

const PAYMENT_LABELS = { CASH: "Contado", CREDIT: "Crédito" } as const;

const lineColumns: Column<SaleLine>[] = [
  { key: "sku", header: "Código", render: (l) => <span className={styles.mono}>{l.sku}</span> },
  { key: "name", header: "Producto", render: (l) => l.productName },
  { key: "qty", header: "Cant.", align: "right", render: (l) => int(l.quantity) },
  { key: "price", header: "Precio", align: "right", render: (l) => money(l.unitPrice) },
  { key: "total", header: "Total", align: "right", render: (l) => money(l.lineTotal) },
];

/** Detalle de una venta (CU-10) y anulación con confirmación (RF-03.4, solo ADMIN). */
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
    <Modal open={id !== null} title={sale.data ? `Factura ${sale.data.invoiceNumber}` : "Detalle de venta"} onClose={close} wide footer={footer}>
      <QueryState query={sale} empty={null}>
        {(s) => (
          <div className={styles.section}>
            <div className={styles.factGrid}>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Fecha</span>
                <span className={styles.factValue}>{dateTime(s.createdAt)}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Cliente</span>
                <span className={styles.factValue}>{s.customerName ?? "Mostrador"}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Vendedor</span>
                <span className={styles.factValue}>{s.username}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Forma de pago</span>
                <span className={styles.factValue}>{PAYMENT_LABELS[s.paymentType]}</span>
              </div>
              <div className={styles.fact}>
                <span className={styles.factLabel}>Estado</span>
                <span>
                  <Badge tone={s.status === "COMPLETED" ? "good" : "bad"}>{s.status === "COMPLETED" ? "Completada" : "Anulada"}</Badge>
                </span>
              </div>
              {s.status === "VOIDED" ? (
                <div className={styles.fact}>
                  <span className={styles.factLabel}>Anulada el</span>
                  <span className={styles.factValue}>{dateTime(s.voidedAt)}</span>
                </div>
              ) : null}
            </div>

            <DataTable columns={lineColumns} rows={s.lines} rowKey={(l) => l.id} />

            <div className={styles.total}>
              <span>Total</span>
              <strong>{money(s.total)}</strong>
            </div>

            {confirming ? (
              <Callout tone="warn">
                Al anular, cada unidad vuelve a su lote de origen, se repone el stock y, si la venta fue a crédito, baja el saldo del cliente. La factura queda marcada como anulada; no se borra.
              </Callout>
            ) : null}
          </div>
        )}
      </QueryState>
    </Modal>
  );
};
