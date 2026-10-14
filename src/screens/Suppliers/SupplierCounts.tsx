import { Odometer } from "@/components/motion";
import { int } from "@/lib/format";
import type { Page } from "@/types/api";
import styles from "./SupplierCounts.module.css";

type CountQuery = { data: Page<unknown> | undefined; isPending: boolean; isError: boolean };
type Item = { query: CountQuery; label: string; hint: string; warnWhenPositive?: boolean };

/** Franja de conteos del directorio: cada cifra es el `count` de un listado de la API y carga o falla por su cuenta. */
export const SupplierCounts = ({ items }: { items: Item[] }) => (
  <dl className={styles.strip}>
    {items.map((item, i) => {
      const count = item.query.data?.count;
      const warn = item.warnWhenPositive && count !== undefined && count > 0;
      return (
        <div key={item.label} className={[styles.cell, warn ? styles.warn : ""].join(" ")} style={{ animationDelay: `${i * 80}ms` }}>
          <dt className={styles.label}>
            <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
            {item.label}
          </dt>
          <dd className={styles.value}>{count !== undefined ? <Odometer value={int(count)} /> : item.query.isPending ? "…" : "—"}</dd>
          <dd className={styles.hint}>{item.query.isError ? "No disponible" : item.query.isPending ? "Cargando" : item.hint}</dd>
        </div>
      );
    })}
  </dl>
);
