import { useEffect, useState, type FormEvent } from "react";
import { useCreateProduct, useUpdateProduct } from "@/hooks/products";
import { fieldErrors } from "@/lib/errors";
import { Button, Checkbox, Field, FieldRow, Input, Modal, Select } from "@/components/ui";
import type { Category, Product } from "@/types/api";
import styles from "./InventoryScreen.module.css";

type Props = { open: boolean; product: Product | null; categories: Category[]; onClose: () => void };

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** CU-05 Crear o editar producto. El backend valida; aquí solo obligatorios y números. */
export const ProductFormModal = ({ open, product, categories, onClose }: Props) => {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [active, setActive] = useState(true);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setCategoryId(product ? String(product.categoryId) : "");
    setPurchasePrice(product ? String(product.purchasePrice) : "");
    setSalePrice(product ? String(product.salePrice) : "");
    setActive(product?.active ?? true);
    setClientErrors({});
    create.reset();
    update.reset();
    // Solo al abrir o cambiar de producto.
  }, [open, product]);

  const mutation = product ? update : create;
  const serverErrors = mutation.error ? fieldErrors(mutation.error) : {};
  const errors: Record<string, string> = { ...serverErrors, ...clientErrors };
  const generalError = mutation.error && Object.keys(serverErrors).length === 0 ? mutation.error.message : undefined;

  const options = categories.filter((c) => c.active || (product !== null && c.id === product.categoryId));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const purchase = round2(Number(purchasePrice));
    const sale = round2(Number(salePrice));
    if (name.trim() === "") errs.name = "Ingrese el nombre.";
    if (sku.trim() === "") errs.sku = "Ingrese el SKU.";
    if (categoryId === "") errs.categoryId = "Seleccione la categoría.";
    if (purchasePrice === "" || Number.isNaN(purchase) || purchase < 0) errs.purchasePrice = "Ingrese un precio válido.";
    if (salePrice === "" || Number.isNaN(sale) || sale < 0) errs.salePrice = "Ingrese un precio válido.";
    setClientErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const input = { name: name.trim(), sku: sku.trim(), categoryId: Number(categoryId), purchasePrice: purchase, salePrice: sale };
    const request = product ? update.mutateAsync({ id: product.id, ...input, active }) : create.mutateAsync(input);
    await request.then(onClose, () => undefined);
  };

  return (
    <Modal
      open={open}
      title={product ? "Editar producto" : "Nuevo producto"}
      description={product ? `${product.sku} · stock actual ${product.stock}` : "El stock inicial se registra después con un lote."}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" loading={mutation.isPending}>
            {product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </>
      }
    >
      <form id="product-form" className={styles.form} onSubmit={submit} noValidate>
        <Field label="Nombre" htmlFor="product-name" error={errors.name}>
          <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(errors.name)} autoFocus required />
        </Field>
        <FieldRow>
          <Field label="SKU" htmlFor="product-sku" error={errors.sku}>
            <Input id="product-sku" value={sku} onChange={(e) => setSku(e.target.value)} invalid={Boolean(errors.sku)} required />
          </Field>
          <Field label="Categoría" htmlFor="product-category" error={errors.categoryId}>
            <Select id="product-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} invalid={Boolean(errors.categoryId)} required>
              <option value="">{options.length === 0 ? "No hay categorías activas" : "Seleccione…"}</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.active ? "" : " (inactiva)"}
                </option>
              ))}
            </Select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Precio de compra" htmlFor="product-purchase" error={errors.purchasePrice}>
            <Input id="product-purchase" type="number" min={0} step="0.01" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} invalid={Boolean(errors.purchasePrice)} required />
          </Field>
          <Field label="Precio de venta" htmlFor="product-sale" error={errors.salePrice}>
            <Input id="product-sale" type="number" min={0} step="0.01" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} invalid={Boolean(errors.salePrice)} required />
          </Field>
        </FieldRow>
        {product ? <Checkbox label="Producto activo (disponible para la venta)" checked={active} onChange={(e) => setActive(e.target.checked)} /> : null}
        {generalError ? <p className={styles.formError}>{generalError}</p> : null}
      </form>
    </Modal>
  );
};
