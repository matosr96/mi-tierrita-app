import { useEffect, useState } from "react";
import { useProductBatches } from "@/hooks/batches";
import { dateOnly, int, money } from "@/lib/format";
import { Button, DataTable, EmptyState, Modal, QueryState, type Column } from "@/components/ui";
import type { Product, ProductBatch } from "@/types/api";
import { ExpiryBadge } from "@/screens/Batches/ExpiryBadge";
import { BatchForm } from "@/screens/Batches/BatchForm";
import styles from "./InventoryScreen.module.css";

type Props = { product: Product | null; canRegister: boolean; onClose: () => void };

const columns: Column<ProductBatch>[] = [
  { key: "lot", header: "Lote", render: (b) => <span className={styles.mono}>#{b.id}</span> },
  { key: "supplier", header: "Proveedor", render: (b) => b.supplierName ?? <span className="muted">—</span> },
  { key: "expires", header: "Vence", render: (b) => dateOnly(b.expiresAt) },
  { key: "days", header: "Días", align: "center", render: (b) => <ExpiryBadge batch={b} /> },
  { key: "remaining", header: "Restante / cantidad", align: "right", render: (b) => `${int(b.quantityRemaining)} / ${int(b.quantity)}` },
  { key: "cost", header: "Costo", align: "right", render: (b) => money(b.unitCost) },
];

/** Lotes de un producto en orden FEFO, con registro de entrada para bodega y administración. */
export const ProductBatchesModal = ({ product, canRegister, onClose }: Props) => {
  const batches = useProductBatches(product?.id ?? null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setShowForm(false);
  }, [product]);

  return (
    <Modal open={product !== null} title={product?.name ?? ""} description={product ? `${product.sku} · ${product.categoryName} · stock actual ${int(product.stock)}` : undefined} onClose={onClose} wide>
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h3>Lotes (primero en vencer, primero en salir)</h3>
          {canRegister && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Registrar lote
            </Button>
          ) : null}
        </div>
        <QueryState
          query={batches}
          isEmpty={(page) => page.items.length === 0}
          empty={<EmptyState title="Este producto no tiene lotes registrados" text={canRegister ? "Registre la entrada de mercancía para crear el primer lote." : "Bodega registra las entradas de mercancía."} />}
        >
          {(page) => (
            <>
              <DataTable columns={columns} rows={page.items} rowKey={(b) => b.id} />
              {page.count > page.items.length ? <p className={styles.tableNote}>Se muestran {int(page.items.length)} de {int(page.count)} lotes.</p> : null}
            </>
          )}
        </QueryState>
      </section>
      {canRegister && showForm && product ? (
        <section className={[styles.section, styles.formSection].join(" ")}>
          <h3>Registrar nuevo lote</h3>
          <BatchForm productId={product.id} onDone={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
        </section>
      ) : null}
    </Modal>
  );
};
