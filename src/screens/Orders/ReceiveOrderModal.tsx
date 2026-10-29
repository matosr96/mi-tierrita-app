import { useState, type FormEvent } from "react";
import { useReceiveOrder } from "@/hooks/orders";
import { fieldErrors } from "@/lib/errors";
import { dateOnly, int, money, todayIso } from "@/lib/format";
import { Button, Callout, Field, Input, Modal } from "@/components/ui";
import type { OrderDetail, ProductBatch } from "@/types/api";
import styles from "./OrdersScreen.module.css";

type Props = { order: OrderDetail; onClose: () => void };

type LineState = { quantity: string; unitCost: string; expiresAt: string };

/**
 * Recibir un pedido a proveedor: por cada línea que falta, la cantidad que llegó (vacío o 0 = no llegó), el costo real
 * (por defecto el esperado) y el vencimiento del lote. Cada línea recibida se registra como compra y crea su lote; si
 * falta algo el pedido queda «Recibido en parte».
 */
export const ReceiveOrderModal = ({ order, onClose }: Props) => {
  const pendingLines = order.lines.filter((l) => l.pendingQuantity > 0);
  const receive = useReceiveOrder();
  const [form, setForm] = useState<Record<number, LineState>>(() =>
    Object.fromEntries(pendingLines.map((l) => [l.id, { quantity: String(l.pendingQuantity), unitCost: String(l.unitPrice), expiresAt: "" }])),
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ batches: ProductBatch[]; complete: boolean } | null>(null);

  const apiErrors = receive.error ? fieldErrors(receive.error) : {};
  const general = receive.error && Object.keys(apiErrors).length === 0 ? receive.error.message : undefined;
  const set = (id: number, changes: Partial<LineState>) => setForm((f) => ({ ...f, [id]: { ...f[id]!, ...changes } }));

  // Los errores de la API vienen por posición en lo enviado; se traducen a la línea del pedido.
  const [sentIds, setSentIds] = useState<number[]>([]);
  const errorFor = (lineId: number, field: string): string | undefined => {
    const local = localErrors[`${lineId}.${field}`];
    if (local) return local;
    const index = sentIds.indexOf(lineId);
    return index >= 0 ? apiErrors[`lines[${index}].${field}`] : undefined;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const lines: { lineId: number; quantity: number; unitCost?: number; expiresAt: string }[] = [];
    for (const l of pendingLines) {
      const s = form[l.id]!;
      const quantity = s.quantity.trim() === "" ? 0 : Number(s.quantity);
      if (!Number.isInteger(quantity) || quantity < 0) {
        next[`${l.id}.quantity`] = "Cantidad entera, cero si no llegó.";
        continue;
      }
      if (quantity === 0) continue;
      if (quantity > l.pendingQuantity) next[`${l.id}.quantity`] = `Faltan ${int(l.pendingQuantity)}: no puede recibir más.`;
      const cost = s.unitCost.trim() === "" ? undefined : Number(s.unitCost);
      if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) next[`${l.id}.unitCost`] = "Costo no válido.";
      if (!s.expiresAt) next[`${l.id}.expiresAt`] = "Indique el vencimiento del lote.";
      else if (s.expiresAt < todayIso()) next[`${l.id}.expiresAt`] = "El lote ya estaría vencido.";
      lines.push({ lineId: l.id, quantity, ...(cost !== undefined ? { unitCost: cost } : {}), expiresAt: s.expiresAt });
    }
    if (Object.keys(next).length === 0 && lines.length === 0) next.form = "Indique la cantidad recibida de al menos un producto.";
    setLocalErrors(next);
    if (Object.keys(next).length > 0) return;
    setSentIds(lines.map((l) => l.lineId));
    try {
      const result = await receive.mutateAsync({ id: order.id, lines });
      setDone({ batches: result.batches, complete: result.order.status === "RECEIVED" });
    } catch {
      /* el error queda en la mutación */
    }
  };

  if (done) {
    return (
      <Modal open title={done.complete ? "Pedido recibido" : "Recepción parcial registrada"} description={`Pedido #${order.id} · ${order.counterpartName}`} onClose={onClose} footer={<Button onClick={onClose}>Cerrar</Button>}>
        <Callout tone="good" title={done.batches.length === 1 ? "Se creó 1 lote" : `Se crearon ${int(done.batches.length)} lotes`}>
          El stock ya quedó actualizado.{done.complete ? "" : " El pedido sigue abierto con lo que falta."}
          <ul className={styles.batchList}>
            {done.batches.map((b) => (
              <li key={b.id}>
                <span className={styles.batchName}>{b.productName}</span>
                <span>
                  {int(b.quantity)} uds. · {money(b.unitCost)} c/u · vence {dateOnly(b.expiresAt)} · lote <span className={styles.mono}>#{b.id}</span>
                </span>
              </li>
            ))}
          </ul>
        </Callout>
      </Modal>
    );
  }

  return (
    <Modal
      open
      wide
      title={`Recibir pedido #${order.id}`}
      description={`${order.counterpartName}. Cada producto recibido crea un lote con su vencimiento y sube el stock.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={receive.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="receive-form" loading={receive.isPending}>
            Registrar recepción
          </Button>
        </>
      }
    >
      <form id="receive-form" className={styles.form} onSubmit={submit} noValidate>
        {general ? <Callout tone="bad">{general}</Callout> : null}
        {localErrors.form ? <Callout tone="warn">{localErrors.form}</Callout> : null}
        {pendingLines.map((l) => (
          <section key={l.id} className={styles.receiveLine} aria-label={`Recepción de ${l.productName}`}>
            <div className={styles.receiveHead}>
              <span className={styles.batchName}>{l.productName}</span>
              <span className={styles.receiveMeta}>
                <span className={styles.mono}>{l.sku}</span> · pedidas {int(l.quantity)} · recibidas {int(l.receivedQuantity)} · faltan {int(l.pendingQuantity)}
              </span>
            </div>
            <div className={styles.receiveFields}>
              <Field label="Cantidad recibida" htmlFor={`recv-${l.id}-qty`} error={errorFor(l.id, "quantity")}>
                <Input id={`recv-${l.id}-qty`} type="number" min={0} max={l.pendingQuantity} step={1} inputMode="numeric" value={form[l.id]!.quantity} onChange={(e) => set(l.id, { quantity: e.target.value })} invalid={Boolean(errorFor(l.id, "quantity"))} />
              </Field>
              <Field label="Costo real" htmlFor={`recv-${l.id}-cost`} hint={`Esperado: ${money(l.unitPrice)}`} error={errorFor(l.id, "unitCost")}>
                <Input id={`recv-${l.id}-cost`} type="number" min={0} step="any" inputMode="decimal" value={form[l.id]!.unitCost} onChange={(e) => set(l.id, { unitCost: e.target.value })} invalid={Boolean(errorFor(l.id, "unitCost"))} />
              </Field>
              <Field label="Vencimiento del lote" htmlFor={`recv-${l.id}-exp`} error={errorFor(l.id, "expiresAt")}>
                <Input id={`recv-${l.id}-exp`} type="date" min={todayIso()} value={form[l.id]!.expiresAt} onChange={(e) => set(l.id, { expiresAt: e.target.value })} invalid={Boolean(errorFor(l.id, "expiresAt"))} />
              </Field>
            </div>
          </section>
        ))}
      </form>
    </Modal>
  );
};
