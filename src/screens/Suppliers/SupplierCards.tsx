import { Badge } from "@/components/ui";
import { dateOnly } from "@/lib/format";
import type { Supplier } from "@/types/api";
import { SupplierActions } from "./SupplierActions";
import styles from "./SupplierCards.module.css";

type Props = {
  suppliers: Supplier[];
  /** «Editar» solo para el Administrador (decisión del lienzo BodProveedores). */
  canEdit: boolean;
  onPurchase: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
};

/** Directorio de proveedores en tarjetas: nombre, estado, NIT, teléfono y acciones. */
export const SupplierCards = ({ suppliers, canEdit, onPurchase, onEdit }: Props) => (
  <ul className={styles.grid}>
    {suppliers.map((s) => (
      <li key={s.id} className={styles.tile}>
        <div className={styles.head}>
          <div className={styles.who}>
            <span className={[styles.name, s.active ? "" : styles.inactive].join(" ")}>{s.name}</span>
            <span className={styles.since}>Desde {dateOnly(s.createdAt)}</span>
          </div>
          <Badge tone={s.active ? "good" : "neutral"}>{s.active ? "Activo" : "Inactivo"}</Badge>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>NIT</dt>
            <dd>{s.taxId ? <span className={styles.code}>{s.taxId}</span> : <span className={styles.missing}>Sin registrar</span>}</dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              {s.phone ? (
                <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className={styles.phone}>
                  {s.phone}
                </a>
              ) : (
                <span className={styles.missing}>Sin registrar</span>
              )}
            </dd>
          </div>
        </dl>
        <SupplierActions supplier={s} canEdit={canEdit} onPurchase={onPurchase} onEdit={onEdit} className={styles.actions} />
      </li>
    ))}
  </ul>
);
