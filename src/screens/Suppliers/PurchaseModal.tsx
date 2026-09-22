import { useState, type FormEvent } from "react";
import { useProducts } from "@/hooks/products";
import { useRegisterPurchase, useSuppliers } from "@/hooks/suppliers";
import { fieldErrors } from "@/lib/errors";
import { dateOnly, int, money, todayIso } from "@/lib/format";
import { Button, Callout, EmptyState, ErrorState, Field, FieldRow, Input, Loading, Modal, Select } from "@/components/ui";
import type { Product, ProductBatch, Supplier } from "@/types/api";
import styles from "./SuppliersScreen.module.css";

/** Con `supplier` fijo (botón de la fila) o `null` (botón del encabezado: se elige en el formulario). */
type Props = { supplier: Supplier | null; onClose: () => void };

type FormState = { supplierId: number | null; productId: number | null; quantity: string; unitCost: string; expiresAt: string };

/** CU-13 Registrar compra: crea un lote asociado al proveedor y sube el stock del producto. */
export const PurchaseModal = ({ supplier, onClose }: Props) => {
  const pickSupplier = supplier === null;
  const products = useProducts({ limit: 100, active: true });
  const suppliers = useSuppliers({ limit: 100, active: true });
  const register = useRegisterPurchase();
  const emptyForm: FormState = { supplierId: supplier?.id ?? null, productId: null, quantity: "", unitCost: "", expiresAt: "" };
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<ProductBatch | null>(null);

  const list: Product[] = products.data?.items ?? [];
  const supplierList: Supplier[] = suppliers.data?.items ?? [];
  const term = filter.trim().toLowerCase();
  const filtered = term ? list.filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)) : list;
  const selected = list.find((p) => p.id === form.productId) ?? null;
  const options = selected && !filtered.includes(selected) ? [selected, ...filtered] : filtered;
  const chosenSupplier = supplier ?? supplierList.find((s) => s.id === form.supplierId) ?? null;

  const apiErrors = register.error ? fieldErrors(register.error) : {};
  const errs = { ...apiErrors, ...localErrors };
  const general = register.error && Object.keys(apiErrors).length === 0 ? register.error.message : undefined;

  const pickProduct = (value: string) => {
    const id = value ? Number(value) : null;
    const product = list.find((p) => p.id === id);
    setForm((f) => ({ ...f, productId: id, unitCost: product ? String(product.purchasePrice) : f.unitCost }));
  };

  const startAnother = () => {
    setCreated(null);
    setForm({ ...emptyForm, supplierId: form.supplierId });
    setLocalErrors({});
    setFilter("");
    register.reset();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const quantity = Number(form.quantity);
    const unitCost = Number(form.unitCost);
    if (form.supplierId === null) next.supplierId = "Seleccione un proveedor.";
    if (form.productId === null) next.productId = "Seleccione un producto.";
    if (!form.quantity || !Number.isInteger(quantity) || quantity <= 0) next.quantity = "Ingrese una cantidad entera mayor que cero.";
    if (form.unitCost === "" || !Number.isFinite(unitCost) || unitCost < 0) next.unitCost = "Ingrese un costo unitario válido.";
    if (!form.expiresAt) next.expiresAt = "Ingrese la fecha de vencimiento.";
    else if (form.expiresAt < todayIso()) next.expiresAt = "La fecha de vencimiento debe ser futura.";
    setLocalErrors(next);
    if (Object.keys(next).length > 0 || form.productId === null || form.supplierId === null) return;
    try {
      const batch = await register.mutateAsync({ supplierId: form.supplierId, productId: form.productId, quantity, unitCost, expiresAt: form.expiresAt });
      setCreated(batch);
    } catch {
      /* el error queda en la mutación y se pinta en el formulario */
    }
  };

  if (created) {
    return (
      <Modal
        open
        title="Compra registrada"
        description={`Proveedor: ${created.supplierName ?? chosenSupplier?.name ?? "—"}`}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={startAnother}>
              Registrar otra compra
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </>
        }
      >
        <Callout tone="good" title="Lote creado">
          El stock del producto ya quedó actualizado.
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Producto</span>
              <span className={styles.summaryValue}>{created.productName}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Cantidad</span>
              <span className={styles.summaryValue}>{int(created.quantity)} unidades</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Costo unitario</span>
              <span className={styles.summaryValue}>{money(created.unitCost)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Vence</span>
              <span className={styles.summaryValue}>{dateOnly(created.expiresAt)}</span>
            </div>
          </div>
        </Callout>
      </Modal>
    );
  }

  const loading = products.isPending || (pickSupplier && suppliers.isPending);
  const failed = products.isError ? products : pickSupplier && suppliers.isError ? suppliers : null;

  return (
    <Modal
      open
      title="Registrar compra"
      description={supplier ? `Proveedor: ${supplier.name}. La compra crea un lote con su fecha de vencimiento.` : "La compra crea un lote con su fecha de vencimiento y sube el stock del producto."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={register.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="purchase-form" loading={register.isPending} disabled={loading || list.length === 0 || (pickSupplier && supplierList.length === 0)}>
            Registrar compra
          </Button>
        </>
      }
    >
      {loading ? (
        <Loading text="Cargando…" inline />
      ) : failed ? (
        <ErrorState error={failed.error} onRetry={() => failed.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="No hay productos activos" text="Registre primero el producto en Inventario para poder comprarlo." />
      ) : pickSupplier && supplierList.length === 0 ? (
        <EmptyState title="No hay proveedores activos" text="Registre primero el proveedor para poder asociarle la compra." />
      ) : (
        <form id="purchase-form" className={styles.form} onSubmit={submit} noValidate>
          {general ? <Callout tone="bad">{general}</Callout> : null}
          {pickSupplier ? (
            <Field label="Proveedor" htmlFor="purchase-supplier" error={errs.supplierId}>
              <Select id="purchase-supplier" value={form.supplierId ?? ""} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value ? Number(e.target.value) : null }))} invalid={Boolean(errs.supplierId)} autoFocus>
                <option value="">Seleccione…</option>
                {supplierList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.taxId ? ` · ${s.taxId}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <div className={styles.productList}>
            <Field label="Buscar producto" htmlFor="purchase-filter" hint={`${int(options.length)} de ${int(list.length)} productos activos`}>
              <Input id="purchase-filter" placeholder="Nombre o SKU" value={filter} onChange={(e) => setFilter(e.target.value)} autoFocus={!pickSupplier} />
            </Field>
            <Field label="Producto" htmlFor="purchase-product" error={errs.productId}>
              <Select id="purchase-product" value={form.productId ?? ""} onChange={(e) => pickProduct(e.target.value)} invalid={Boolean(errs.productId)}>
                <option value="">Seleccione…</option>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.sku}
                  </option>
                ))}
              </Select>
            </Field>
            {selected ? (
              <div className={styles.productMeta}>
                <span>Categoría: {selected.categoryName}</span>
                <span>Stock actual: {int(selected.stock)}</span>
                <span>Último costo: {money(selected.purchasePrice)}</span>
              </div>
            ) : null}
          </div>
          <FieldRow>
            <Field label="Cantidad" htmlFor="purchase-quantity" error={errs.quantity}>
              <Input id="purchase-quantity" type="number" min={1} step={1} inputMode="numeric" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} invalid={Boolean(errs.quantity)} />
            </Field>
            <Field label="Costo unitario" htmlFor="purchase-cost" hint="Se sugiere el precio de compra del producto" error={errs.unitCost}>
              <Input id="purchase-cost" type="number" min={0} step="any" inputMode="decimal" value={form.unitCost} onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))} invalid={Boolean(errs.unitCost)} />
            </Field>
          </FieldRow>
          <Field label="Fecha de vencimiento" htmlFor="purchase-expires" error={errs.expiresAt}>
            <Input id="purchase-expires" type="date" min={todayIso()} value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} invalid={Boolean(errs.expiresAt)} />
          </Field>
        </form>
      )}
    </Modal>
  );
};
