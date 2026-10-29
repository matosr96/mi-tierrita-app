import { Badge } from "@/components/ui";
import type { Supplier } from "@/types/api";
import { SupplierActions } from "./SupplierActions";
import styles from "./SupplierList.module.css";

type Props = {
  suppliers: Supplier[];
  /** «Editar» solo para el Administrador (decisión del lienzo BodProveedores). */
  canEdit: boolean;
  onPurchase: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
};

/** Directorio de proveedores en lista compacta: nombre con NIT y teléfono, estado y acciones. */
export const SupplierList = ({ suppliers, canEdit, onPurchase, onEdit }: Props) => (
  <ul className={styles.list}>
    {suppliers.map((s) => (
      <li key={s.id} className={styles.row}>
        <div className={styles.who}>
          <span className={[styles.name, s.active ? "" : styles.inactive].join(" ")}>{s.name}</span>
          <span className={styles.meta}>
            <span>
              NIT <span className={styles.code}>{s.taxId ?? "sin registrar"}</span>
            </span>
            <span>
              Tel.{" "}
              {s.phone ? (
                <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className={styles.code}>
                  {s.phone}
                </a>
              ) : (
                <span className={styles.code}>sin registrar</span>
              )}
            </span>
          </span>
        </div>
        <Badge tone={s.active ? "good" : "neutral"}>{s.active ? "Activo" : "Inactivo"}</Badge>
        <SupplierActions supplier={s} canEdit={canEdit} onPurchase={onPurchase} onEdit={onEdit} className={styles.actions} />
      </li>
    ))}
  </ul>
);
