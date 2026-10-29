import { Badge, DataTable, type Column } from "@/components/ui";
import { dateOnly } from "@/lib/format";
import type { Supplier } from "@/types/api";
import { SupplierActions } from "./SupplierActions";
import styles from "./SupplierTable.module.css";

type Props = {
  suppliers: Supplier[];
  /** «Editar» solo para el Administrador (decisión del lienzo BodProveedores). */
  canEdit: boolean;
  onPurchase: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
};

const Missing = () => <span className={styles.missing}>Sin registrar</span>;

/** Directorio de proveedores en tabla: nombre, NIT, teléfono, estado y acciones de la fila. */
export const SupplierTable = ({ suppliers, canEdit, onPurchase, onEdit }: Props) => {
  const columns: Column<Supplier>[] = [
    {
      key: "name",
      header: "Proveedor",
      render: (s) => (
        <div className={styles.who}>
          <span className={[styles.name, s.active ? "" : styles.inactive].join(" ")}>{s.name}</span>
          <span className={styles.since}>Desde {dateOnly(s.createdAt)}</span>
        </div>
      ),
    },
    { key: "taxId", header: "NIT", align: "left", render: (s) => (s.taxId ? <span className={styles.code}>{s.taxId}</span> : <Missing />) },
    {
      key: "phone",
      header: "Teléfono",
      align: "left",
      render: (s) =>
        s.phone ? (
          <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className={styles.phone}>
            {s.phone}
          </a>
        ) : (
          <Missing />
        ),
    },
    { key: "status", header: "Estado", align: "left", render: (s) => <Badge tone={s.active ? "good" : "neutral"}>{s.active ? "Activo" : "Inactivo"}</Badge> },
    {
      key: "actions",
      header: <span className={styles.srOnly}>Acciones</span>,
      label: "",
      align: "right",
      render: (s) => <SupplierActions supplier={s} canEdit={canEdit} onPurchase={onPurchase} onEdit={onEdit} className={styles.actions} />,
    },
  ];

  return (
    <div className={styles.frame}>
      <DataTable columns={columns} rows={suppliers} rowKey={(s) => s.id} />
    </div>
  );
};
