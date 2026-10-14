import type { CSSProperties, MouseEvent } from "react";
import { Badge } from "@/components/ui";
import { trackSpotlight } from "@/components/motion";
import { int, money } from "@/lib/format";
import type { Product } from "@/types/api";
import { LOW_STOCK, stockStatus } from "./stockStatus";
import { ProductVisual } from "./ProductVisual";
import styles from "./ProductMosaic.module.css";

type Props = {
  products: Product[];
  canEdit: boolean;
  isAdmin: boolean;
  onOpen: (p: Product, el: HTMLElement | null) => void;
  onEdit: (p: Product) => void;
  onDeactivate: (p: Product) => void;
};

const TINTS = 6;

/** Catálogo en mosaico: una tarjeta por producto con visual generativo, precio y medidor de stock. */
export const ProductMosaic = ({ products, canEdit, isAdmin, onOpen, onEdit, onDeactivate }: Props) => {
  // Escala solo visual del medidor: el mayor stock de la página, con un piso para que pocas unidades no llenen la barra.
  const gaugeMax = Math.max(LOW_STOCK * 4, ...products.map((p) => p.stock));

  const open = (p: Product) => (e: MouseEvent<HTMLElement>) => onOpen(p, e.currentTarget.parentElement);

  return (
    <ul className={styles.mosaic}>
      {products.map((p, i) => {
        const s = stockStatus(p);
        const fill = Math.min(100, (p.stock / gaugeMax) * 100);
        return (
          <li key={p.id} className={[styles.tile, styles[`tint${p.categoryId % TINTS}`], p.active ? "" : styles.inactive].join(" ")} style={{ "--i": Math.min(i, 14) } as CSSProperties} onPointerMove={trackSpotlight}>
            <div className={styles.visual}>
              <ProductVisual seed={p.id} variant={p.categoryId} />
              <span className={styles.sku}>{p.sku}</span>
              <span className={styles.visualBadge}>
                <Badge tone={s.tone}>{s.label}</Badge>
              </span>
            </div>
            <div className={styles.body}>
              <span className={styles.category}>
                <span className={styles.categoryDot} aria-hidden="true" />
                {p.categoryName}
              </span>
              <h3 className={styles.name}>{p.name}</h3>
              <div className={styles.price}>{money(p.salePrice)}</div>
              <div className={styles.gauge}>
                <div className={styles.gaugeHead}>
                  <span>Stock</span>
                  <span className={styles.gaugeValue}>{int(p.stock)} u.</span>
                </div>
                <div className={[styles.gaugeTrack, styles[`gauge_${s.tone}`]].join(" ")} role="meter" aria-valuemin={0} aria-valuemax={gaugeMax} aria-valuenow={p.stock} aria-label={`Stock de ${p.name}`}>
                  <span className={styles.gaugeFill} style={{ "--fill": `${fill}%` } as CSSProperties} />
                  <span className={styles.gaugeTick} style={{ left: `${(LOW_STOCK / gaugeMax) * 100}%` }} aria-hidden="true" />
                </div>
              </div>
            </div>
            <button type="button" className={styles.hit} onClick={open(p)} aria-label={`Ver lotes de ${p.name}`} />
            {canEdit ? (
              <div className={styles.actions}>
                <button type="button" className={styles.action} onClick={() => onEdit(p)}>
                  Editar
                </button>
                {isAdmin && p.active ? (
                  <button type="button" className={[styles.action, styles.actionDanger].join(" ")} onClick={() => onDeactivate(p)}>
                    Desactivar
                  </button>
                ) : null}
                <span className={styles.actionHint} aria-hidden="true">
                  Ver lotes →
                </span>
              </div>
            ) : (
              <div className={styles.actions} aria-hidden="true">
                <span className={styles.actionHint}>Ver lotes →</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
