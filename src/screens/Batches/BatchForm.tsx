import { useEffect, useState, type FormEvent } from "react";
import { useRegisterBatch } from "@/hooks/batches";
import { useSuppliers } from "@/hooks/suppliers";
import { fieldErrors } from "@/lib/errors";
import { Button, Field, FieldRow, Input, Select } from "@/components/ui";
import styles from "./BatchForm.module.css";

type Props = {
  /** Producto al que se le registra el lote; si es null el formulario pide elegir uno. */
  productId: number | null;
  onDone?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** CU-06 Registrar lote: cantidad, vencimiento, costo unitario y proveedor opcionales. */
export const BatchForm = ({ productId, onDone, onCancel, submitLabel = "Registrar lote" }: Props) => {
  const suppliers = useSuppliers({ limit: 100, active: true });
  const register = useRegisterBatch();
  const [quantity, setQuantity] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    register.reset();
    setClientErrors({});
  }, [productId]);

  const errors: Record<string, string> = { ...(register.error ? fieldErrors(register.error) : {}), ...clientErrors };
  const generalError = register.error && Object.keys(fieldErrors(register.error)).length === 0 ? register.error.message : undefined;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const qty = Number(quantity);
    if (productId === null) errs.productId = "Seleccione un producto.";
    if (quantity === "" || !Number.isInteger(qty) || qty <= 0) errs.quantity = "Ingrese una cantidad entera mayor que cero.";
    if (expiresAt === "") errs.expiresAt = "Ingrese la fecha de vencimiento.";
    const cost = unitCost === "" ? undefined : round2(Number(unitCost));
    if (cost !== undefined && (Number.isNaN(cost) || cost < 0)) errs.unitCost = "Ingrese un costo válido.";
    setClientErrors(errs);
    if (Object.keys(errs).length > 0 || productId === null) return;
    await register
      .mutateAsync({
        productId,
        quantity: qty,
        expiresAt,
        ...(cost !== undefined ? { unitCost: cost } : {}),
        ...(supplierId !== "" ? { supplierId: Number(supplierId) } : {}),
      })
      .then(
        () => {
          setQuantity("");
          setExpiresAt("");
          setUnitCost("");
          setSupplierId("");
          onDone?.();
        },
        () => undefined,
      );
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {errors.productId ? <p className={styles.error}>{errors.productId}</p> : null}
      <FieldRow>
        <Field label="Cantidad" htmlFor="batch-quantity" error={errors.quantity}>
          <Input id="batch-quantity" type="number" min={1} step={1} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} invalid={Boolean(errors.quantity)} required />
        </Field>
        <Field label="Vence" htmlFor="batch-expires" error={errors.expiresAt}>
          <Input id="batch-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} invalid={Boolean(errors.expiresAt)} required />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Costo unitario (opcional)" htmlFor="batch-cost" error={errors.unitCost} hint="Si se omite, se usa el precio de compra del producto.">
          <Input id="batch-cost" type="number" min={0} step="0.01" inputMode="decimal" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} invalid={Boolean(errors.unitCost)} />
        </Field>
        <Field label="Proveedor (opcional)" htmlFor="batch-supplier" error={errors.supplierId}>
          <Select id="batch-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} invalid={Boolean(errors.supplierId)}>
            <option value="">{suppliers.isPending ? "Cargando…" : suppliers.isError ? "No disponible" : "Sin proveedor"}</option>
            {(suppliers.data?.items ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </FieldRow>
      {generalError ? <p className={styles.error}>{generalError}</p> : null}
      <div className={styles.actions}>
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} disabled={register.isPending}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" loading={register.isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
