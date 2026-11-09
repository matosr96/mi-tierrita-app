import type { Product } from "@/types/api";
import { Button } from "@/components/ui";
import { int, money } from "@/lib/format";
import styles from "./ProductPickList.module.css";

type Props = {
  products: Product[];
  sellable: (p: Product) => number;
  quantityInCart: (p: Product) => number;
  onAdd: (p: Product) => void;
};

/**
 * Lista compacta del punto de venta para el teléfono: un renglón por producto (nombre, código, disponible, precio y
 * «Agregar»). La tabla apilada ocupaba unos 200 px por producto y dejaba el carrito miles de píxeles más abajo.
 */
export const ProductPickList = ({ products, sellable, quantityInCart, onAdd }: Props) => (
  <ul className={styles.list}>
    {products.map((p) => {
      const available = sellable(p);
      const inCart = quantityInCart(p);
      const expired = p.stock - available;
      return (
        <li key={p.id} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.meta}>
              <span className={styles.code}>{p.sku}</span>
              <span className={available <= 0 ? styles.out : undefined}>{available <= 0 ? "Sin existencias" : `${int(available)} disp.`}</span>
              {expired > 0 ? <span className={styles.expired}>{`${int(expired)} vencidas`}</span> : null}
            </span>
          </div>
          <div className={styles.side}>
            <span className={styles.price}>{money(p.salePrice)}</span>
            <Button variant="secondary" size="sm" disabled={available <= 0 || inCart >= available} onClick={() => onAdd(p)}>
              {inCart > 0 ? `Agregar (${int(inCart)})` : "Agregar"}
            </Button>
          </div>
        </li>
      );
    })}
  </ul>
);
