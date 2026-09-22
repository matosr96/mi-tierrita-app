import { useEffect, useMemo, useState } from "react";
import { useProducts } from "@/hooks/products";
import { int } from "@/lib/format";
import { Field, Input, Loading, Modal, Select } from "@/components/ui";
import { BatchForm } from "./BatchForm";
import styles from "./BatchesScreen.module.css";

type Props = { open: boolean; onClose: () => void };

/** Entrada de mercancía desde Lotes: se elige el producto y se registra el lote. */
export const RegisterBatchModal = ({ open, onClose }: Props) => {
  const products = useProducts({ limit: 100, active: true });
  const [filter, setFilter] = useState("");
  const [productId, setProductId] = useState("");

  useEffect(() => {
    if (!open) {
      setFilter("");
      setProductId("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const items = products.data?.items ?? [];
    const q = filter.trim().toLowerCase();
    if (q === "") return items;
    return items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products.data, filter]);

  const selected = products.data?.items.find((p) => String(p.id) === productId);

  return (
    <Modal open={open} title="Registrar lote" description="Entrada de mercancía: el stock del producto sube con la cantidad del lote." onClose={onClose}>
      {products.isPending ? (
        <Loading inline text="Cargando productos…" />
      ) : products.isError ? (
        <p className={styles.formError}>No se pudieron cargar los productos.</p>
      ) : (
        <div className={styles.pickProduct}>
          <Field label="Buscar producto" htmlFor="pick-filter" hint={products.data.count > products.data.items.length ? `Se muestran ${int(products.data.items.length)} de ${int(products.data.count)} productos activos.` : undefined}>
            <Input id="pick-filter" placeholder="Nombre o SKU" value={filter} onChange={(e) => setFilter(e.target.value)} autoFocus />
          </Field>
          <Field label="Producto" htmlFor="pick-product">
            <Select id="pick-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">{filtered.length === 0 ? "Sin coincidencias" : "Seleccione un producto"}</option>
              {filtered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name}
                </option>
              ))}
            </Select>
          </Field>
          {selected ? (
            <p className={styles.pickSummary}>
              {selected.categoryName} · stock actual {int(selected.stock)}
            </p>
          ) : null}
        </div>
      )}
      <BatchForm productId={selected ? selected.id : null} onDone={onClose} onCancel={onClose} />
    </Modal>
  );
};
