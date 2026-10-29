import { useState } from "react";
import { useDeliverOrder } from "@/hooks/orders";
import { useSales } from "@/hooks/sales";
import { dateTime, money } from "@/lib/format";
import { Button, Callout, Field, Loading, Select } from "@/components/ui";
import type { OrderDetail } from "@/types/api";
import styles from "./OrdersScreen.module.css";

type Props = { order: OrderDetail; initialSaleId: number | null; onCancel: () => void; onDelivered: () => void };

/**
 * Confirmación de «Marcar entregado»: opcionalmente, la venta con que se cobró el encargo (ventas vigentes del mismo
 * cliente; la API valida que lo sean y que no cobre otro encargo).
 */
export const DeliverOrderPanel = ({ order, initialSaleId, onCancel, onDelivered }: Props) => {
  const sales = useSales({ customerId: order.customerId ?? undefined, status: "COMPLETED", limit: 20 });
  const deliver = useDeliverOrder();
  const [saleId, setSaleId] = useState<number | null>(initialSaleId);

  const confirm = async () => {
    try {
      await deliver.mutateAsync({ id: order.id, ...(saleId !== null ? { saleId } : {}) });
      onDelivered();
    } catch {
      /* el error queda en la mutación */
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="deliver-title">
      <h3 id="deliver-title" className={styles.panelTitle}>
        Marcar entregado
      </h3>
      <p className={styles.panelText}>El encargo se cierra como entregado. Si ya se cobró, indique la venta.</p>
      {deliver.error ? <Callout tone="bad">{deliver.error.message}</Callout> : null}
      {sales.isPending ? (
        <Loading inline text="Buscando ventas del cliente…" />
      ) : (
        <Field label="Venta con que se cobró" htmlFor="deliver-sale" hint="Opcional. Ventas vigentes de este cliente, de la más reciente a la más antigua.">
          <Select id="deliver-sale" value={saleId ?? ""} onChange={(e) => setSaleId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Sin venta asociada</option>
            {(sales.data?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.invoiceNumber} · {money(s.total)} · {dateTime(s.createdAt)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className={styles.panelActions}>
        <Button variant="secondary" onClick={onCancel} disabled={deliver.isPending}>
          Volver
        </Button>
        <Button onClick={confirm} loading={deliver.isPending}>
          Confirmar entrega
        </Button>
      </div>
    </section>
  );
};
