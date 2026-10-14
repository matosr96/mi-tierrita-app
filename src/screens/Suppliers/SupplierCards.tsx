import type { CSSProperties } from "react";
import { trackSpotlight } from "@/components/motion";
import { dateOnly } from "@/lib/format";
import type { Supplier } from "@/types/api";
import styles from "./SupplierCards.module.css";

type Props = {
  suppliers: Supplier[];
  /** «Editar» solo para el Administrador (decisión del lienzo BodProveedores). */
  canEdit: boolean;
  onPurchase: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
};

const TINTS = 5;

/** Iniciales de las dos primeras palabras (presentación). */
const sealOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase() || "·";

/** Directorio como fichas de remisión: sello con iniciales, contacto en mono, estado y acciones. */
export const SupplierCards = ({ suppliers, canEdit, onPurchase, onEdit }: Props) => (
  <ul className={styles.grid}>
    {suppliers.map((s, i) => (
      <li key={s.id} className={[styles.card, styles[`t${s.id % TINTS}`], s.active ? "" : styles.inactive].join(" ")} style={{ "--i": Math.min(i, 14) } as CSSProperties} onPointerMove={trackSpotlight}>
        <div className={styles.top}>
          <span className={styles.seal} aria-hidden="true">
            {sealOf(s.name)}
          </span>
          <div className={styles.who}>
            <span className={styles.number}>Proveedor N.º {String(s.id).padStart(4, "0")}</span>
            <h3 className={styles.name}>{s.name}</h3>
            <span className={styles.since}>Desde {dateOnly(s.createdAt)}</span>
          </div>
          <span className={[styles.status, s.active ? styles.statusOn : ""].join(" ")}>
            <span className={styles.statusDot} aria-hidden="true" />
            {s.active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className={styles.perforation} aria-hidden="true" />

        <dl className={styles.contact}>
          <div>
            <dt>NIT</dt>
            <dd>{s.taxId ?? <span className={styles.missing}>sin registrar</span>}</dd>
          </div>
          <div>
            <dt>Tel.</dt>
            <dd>
              {s.phone ? (
                <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className={styles.phone}>
                  {s.phone}
                </a>
              ) : (
                <span className={styles.missing}>sin registrar</span>
              )}
            </dd>
          </div>
        </dl>

        {s.active || canEdit ? (
          <div className={styles.actions}>
            {s.active ? (
              <button type="button" className={styles.purchase} onClick={() => onPurchase(s)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 4.5 L7 2 L12 4.5 V9.5 L7 12 L2 9.5 Z M2 4.5 L7 7 L12 4.5 M7 7 V12" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
                Registrar compra
              </button>
            ) : null}
            {canEdit ? (
              <button type="button" className={styles.edit} onClick={() => onEdit(s)}>
                Editar
              </button>
            ) : null}
          </div>
        ) : null}
      </li>
    ))}
  </ul>
);
