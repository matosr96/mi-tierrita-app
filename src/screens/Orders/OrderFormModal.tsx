import { useState, type FormEvent } from "react";
import { useCreateOrder, useUpdateOrder } from "@/hooks/orders";
import { useProducts } from "@/hooks/products";
import { useSuppliers } from "@/hooks/suppliers";
import { useCustomers } from "@/hooks/customers";
import { fieldErrors } from "@/lib/errors";
import { money, todayIso } from "@/lib/format";
import { Button, Callout, EmptyState, ErrorState, Field, FieldRow, Input, Loading, Modal, Select } from "@/components/ui";
import type { OrderDetail, OrderKind, OrderLineInput, Product } from "@/types/api";
import { COUNTERPART_LABEL, DUE_LABEL, PRICE_LABEL } from "./orderLabels";
import styles from "./OrdersScreen.module.css";

type Props = { kind: OrderKind; order: OrderDetail | null; onClose: () => void; onSaved: (order: OrderDetail) => void };

type LineState = { key: number; productId: number | null; quantity: string; unitPrice: string };

let nextKey = 1;
const emptyLine = (): LineState => ({ key: nextKey++, productId: null, quantity: "1", unitPrice: "" });

/**
 * Crear o editar un pedido. El tipo lo da la pestaña: a proveedor (proveedor, costo esperado, llegada) o de cliente
 * (cliente, precio acordado, entrega). Al elegir el producto se sugiere su precio de compra o de venta; si se deja vacío
 * lo pone el servidor. El total que se muestra es una vista previa estimada: el definitivo lo calcula la API.
 */
export const OrderFormModal = ({ kind, order, onClose, onSaved }: Props) => {
  const editing = order !== null;
  const isSupplier = kind === "SUPPLIER";
  const products = useProducts({ limit: 100, active: true });
  const suppliers = useSuppliers({ limit: 100, active: true });
  const customers = useCustomers({ limit: 100, active: true });
  const counterparts = isSupplier ? suppliers : customers;
  const create = useCreateOrder();
  const update = useUpdateOrder();
  const mutation = editing ? update : create;

  const [counterpartId, setCounterpartId] = useState<number | null>(order ? (isSupplier ? order.supplierId : order.customerId) : null);
  const [dueDate, setDueDate] = useState(order?.dueDate ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [lines, setLines] = useState<LineState[]>(
    order ? order.lines.map((l) => ({ key: nextKey++, productId: l.productId, quantity: String(l.quantity), unitPrice: String(l.unitPrice) })) : [emptyLine()],
  );
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const productList: Product[] = products.data?.items ?? [];
  const counterpartList = (counterparts.data?.items ?? []) as { id: number; name: string }[];
  const apiErrors = mutation.error ? fieldErrors(mutation.error) : {};
  const errs = { ...apiErrors, ...localErrors };
  const general = mutation.error && Object.keys(apiErrors).length === 0 ? mutation.error.message : undefined;
  const counterpartField = isSupplier ? "supplierId" : "customerId";

  const setLine = (key: number, changes: Partial<LineState>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...changes } : l)));
  const pickProduct = (key: number, raw: string) => {
    const id = raw ? Number(raw) : null;
    const product = productList.find((p) => p.id === id);
    setLine(key, { productId: id, unitPrice: product ? String(isSupplier ? product.purchasePrice : product.salePrice) : "" });
  };

  /** Única suma del cliente: vista previa marcada como estimada (el total real lo devuelve la API). */
  const estimated = lines.reduce((sum, l) => {
    const q = Number(l.quantity);
    const p = Number(l.unitPrice);
    return Number.isFinite(q) && Number.isFinite(p) ? sum + q * p : sum;
  }, 0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (counterpartId === null) next[counterpartField] = `Seleccione un ${isSupplier ? "proveedor" : "cliente"}.`;
    if (!dueDate) next.dueDate = "Indique la fecha.";
    const parsed: OrderLineInput[] = [];
    const seen = new Set<number>();
    lines.forEach((l, i) => {
      const quantity = Number(l.quantity);
      if (l.productId === null) next[`lines[${i}].productId`] = "Seleccione un producto.";
      else if (seen.has(l.productId)) next[`lines[${i}].productId`] = "Ese producto ya está en otra línea.";
      if (!Number.isInteger(quantity) || quantity <= 0) next[`lines[${i}].quantity`] = "Cantidad entera mayor que cero.";
      const price = l.unitPrice.trim() === "" ? undefined : Number(l.unitPrice);
      if (price !== undefined && (!Number.isFinite(price) || price < 0)) next[`lines[${i}].unitPrice`] = "Precio no válido.";
      if (l.productId !== null) {
        seen.add(l.productId);
        parsed.push({ productId: l.productId, quantity, ...(price !== undefined ? { unitPrice: price } : {}) });
      }
    });
    setLocalErrors(next);
    if (Object.keys(next).length > 0 || counterpartId === null) return;
    const party = isSupplier ? { supplierId: counterpartId } : { customerId: counterpartId };
    try {
      const saved = editing
        ? await update.mutateAsync({ id: order.id, ...party, dueDate, note: note.trim() === "" ? null : note.trim(), lines: parsed })
        : await create.mutateAsync({ kind, ...party, dueDate, ...(note.trim() ? { note: note.trim() } : {}), lines: parsed });
      onSaved(saved);
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  const loading = products.isPending || counterparts.isPending;
  const failed = products.isError ? products : counterparts.isError ? counterparts : null;
  const title = editing ? `Editar pedido #${order.id}` : isSupplier ? "Nuevo pedido a proveedor" : "Nuevo pedido de cliente";

  return (
    <Modal
      open
      wide
      title={title}
      description={isSupplier ? "Lo que se espera recibir: al llegar se registra como compra y crea el lote." : "Un encargo del cliente con el precio acordado y la fecha de entrega."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="order-form" loading={mutation.isPending} disabled={loading || productList.length === 0 || counterpartList.length === 0}>
            {editing ? "Guardar cambios" : "Crear pedido"}
          </Button>
        </>
      }
    >
      {loading ? (
        <Loading text="Cargando…" inline />
      ) : failed ? (
        <ErrorState error={failed.error} onRetry={() => failed.refetch()} />
      ) : productList.length === 0 ? (
        <EmptyState title="No hay productos activos" text="Registre primero el producto en Inventario." />
      ) : counterpartList.length === 0 ? (
        <EmptyState title={isSupplier ? "No hay proveedores activos" : "No hay clientes activos"} text={isSupplier ? "Registre primero el proveedor." : "Registre primero el cliente en Clientes y cartera."} />
      ) : (
        <form id="order-form" className={styles.form} onSubmit={submit} noValidate>
          {general ? <Callout tone="bad">{general}</Callout> : null}
          <FieldRow>
            <Field label={COUNTERPART_LABEL[kind]} htmlFor="order-counterpart" error={errs[counterpartField]}>
              <Select id="order-counterpart" value={counterpartId ?? ""} onChange={(e) => setCounterpartId(e.target.value ? Number(e.target.value) : null)} invalid={Boolean(errs[counterpartField])} autoFocus>
                <option value="">Seleccione…</option>
                {counterpartList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={DUE_LABEL[kind]} htmlFor="order-due" error={errs.dueDate}>
              <Input id="order-due" type="date" min={editing ? undefined : todayIso()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} invalid={Boolean(errs.dueDate)} />
            </Field>
          </FieldRow>

          <fieldset className={styles.lines}>
            <legend className={styles.legend}>Productos</legend>
            {errs.lines ? <span className={styles.lineError}>{errs.lines}</span> : null}
            {lines.map((l, i) => (
              <div key={l.key} className={styles.lineRow}>
                <Field label="Producto" htmlFor={`order-line-${l.key}-product`} error={errs[`lines[${i}].productId`]}>
                  <Select id={`order-line-${l.key}-product`} value={l.productId ?? ""} onChange={(e) => pickProduct(l.key, e.target.value)} invalid={Boolean(errs[`lines[${i}].productId`])}>
                    <option value="">Seleccione…</option>
                    {productList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.sku}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Cantidad" htmlFor={`order-line-${l.key}-qty`} error={errs[`lines[${i}].quantity`]}>
                  <Input id={`order-line-${l.key}-qty`} type="number" min={1} step={1} inputMode="numeric" value={l.quantity} onChange={(e) => setLine(l.key, { quantity: e.target.value })} invalid={Boolean(errs[`lines[${i}].quantity`])} />
                </Field>
                <Field label={PRICE_LABEL[kind]} htmlFor={`order-line-${l.key}-price`} error={errs[`lines[${i}].unitPrice`]}>
                  <Input id={`order-line-${l.key}-price`} type="number" min={0} step="any" inputMode="decimal" value={l.unitPrice} onChange={(e) => setLine(l.key, { unitPrice: e.target.value })} invalid={Boolean(errs[`lines[${i}].unitPrice`])} />
                </Field>
                <button
                  type="button"
                  className={styles.removeLine}
                  onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  disabled={lines.length === 1}
                  aria-label={`Quitar la línea ${i + 1}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            <div className={styles.linesFoot}>
              <Button variant="secondary" size="sm" onClick={() => setLines((prev) => [...prev, emptyLine()])} disabled={lines.length >= 100}>
                Agregar producto
              </Button>
              <span className={styles.estimate}>
                Total <span className={styles.estimatedTag}>estimado</span> <strong>{money(estimated)}</strong>
              </span>
            </div>
          </fieldset>

          <Field label="Nota" htmlFor="order-note" hint="Opcional. Máximo 500 caracteres." error={errs.note}>
            <Input id="order-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isSupplier ? "Ej.: confirmar con el vendedor" : "Ej.: lo recoge el sábado"} />
          </Field>
        </form>
      )}
    </Modal>
  );
};
