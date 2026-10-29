import { int, money } from "@/lib/format";
import type { Product } from "@/types/api";
import styles from "./ProductList.module.css";

type Props = { products: Product[]; onOpen: (p: Product) => void };

/** Catálogo en lista compacta: nombre, código, stock vendible hoy (FEFO, de la API) y precio; la fila abre los lotes. */
export const ProductList = ({ products, onOpen }: Props) => (
  <ul className={styles.list}>
    {products.map((p) => (
      <li key={p.id}>
        <button type="button" className={[styles.row, p.active ? "" : styles.inactive].join(" ")} onClick={() => onOpen(p)}>
          <span className={styles.who}>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.sku}>{p.sku}</span>
          </span>
          <span className={styles.figure}>
            <span className={styles.label}>Vendible</span>
            <span className={[styles.value, p.availableStock === 0 ? styles.zero : ""].join(" ")}>{int(p.availableStock)} u.</span>
          </span>
          <span className={styles.figure}>
            <span className={styles.label}>Precio</span>
            <span className={styles.value}>{money(p.salePrice)}</span>
          </span>
        </button>
      </li>
    ))}
  </ul>
);
