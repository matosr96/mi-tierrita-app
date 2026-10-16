import type { CSSProperties } from "react";
import { Badge } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { Product } from "@/types/api";
import { LOW_STOCK, expiredUnits, stockStatus } from "./stockStatus";
import styles from "./ProductMosaic.module.css";

type Props = {
  products: Product[];
  canEdit: boolean;
  isAdmin: boolean;
  onOpen: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDeactivate: (p: Product) => void;
};

/** Catálogo en tarjetas compactas: nombre, línea, precio, stock con barra fina y acciones. */
export const ProductMosaic = ({ products, canEdit, isAdmin, onOpen, onEdit, onDeactivate }: Props) => {
  // Escala solo visual de la barra: el mayor stock de la página, con un piso para que pocas unidades no la llenen.
  const gaugeMax = Math.max(LOW_STOCK * 4, ...products.map((p) => p.stock));

  return (
    <ul className={styles.mosaic}>
      {products.map((p) => {
        const s = stockStatus(p);
        const fill = Math.min(100, (p.stock / gaugeMax) * 100);
        return (
          <li key={p.id} className={[styles.tile, p.active ? "" : styles.inactive].join(" ")}>
            <div className={styles.body}>
              <div className={styles.head}>
                <h3 className={styles.name}>{p.name}</h3>
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>
              <div className={styles.meta}>
                <span className={styles.sku}>{p.sku}</span>
                <span aria-hidden="true">·</span>
                <span className={styles.category}>{p.categoryName}</span>
              </div>
              <div className={styles.price}>{money(p.salePrice)}</div>
              <div className={styles.gauge}>
                <div className={styles.gaugeHead}>
                  <span>Stock</span>
                  <span className={styles.gaugeValue}>
                    {int(p.stock)} u.{expiredUnits(p) > 0 ? ` · ${int(expiredUnits(p))} vencidas` : ""}
                  </span>
                </div>
                <div className={[styles.gaugeTrack, styles[`gauge_${s.tone}`]].join(" ")} role="meter" aria-valuemin={0} aria-valuemax={gaugeMax} aria-valuenow={p.stock} aria-label={`Stock de ${p.name}`}>
                  <span className={styles.gaugeFill} style={{ width: `${fill}%` } as CSSProperties} />
                </div>
              </div>
            </div>
            <button type="button" className={styles.hit} onClick={() => onOpen(p)} aria-label={`Ver lotes de ${p.name}`} />
            <div className={styles.actions}>
              {canEdit ? (
                <>
                  <button type="button" className={styles.action} onClick={() => onEdit(p)}>
                    Editar
                  </button>
                  {isAdmin && p.active ? (
                    <button type="button" className={[styles.action, styles.actionDanger].join(" ")} onClick={() => onDeactivate(p)}>
                      Desactivar
                    </button>
                  ) : null}
                </>
              ) : null}
              <span className={styles.actionHint} aria-hidden="true">
                Ver lotes
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
