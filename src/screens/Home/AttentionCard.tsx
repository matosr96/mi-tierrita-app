import { Link } from "react-router-dom";
import { Card, Loading } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { InventoryReport, ReceivablesReport } from "@/types/api";
import styles from "./HomeScreen.module.css";

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean; refetch: () => unknown };
type Props = { inventory: QueryLike<InventoryReport>; receivables: QueryLike<ReceivablesReport> };
type Item = { key: string; tone: "bad" | "warn"; text: string; to: string; action: string };

/** Pendientes del administrador según los reportes de inventario y cartera. */
export const AttentionCard = ({ inventory, receivables }: Props) => {
  const items: Item[] = [];
  const inv = inventory.data;
  const rec = receivables.data;
  if (inv) {
    if (inv.outOfStock > 0) items.push({ key: "stock", tone: "bad", text: `${int(inv.outOfStock)} ${inv.outOfStock === 1 ? "producto sin stock" : "productos sin stock"}`, to: "/inventario", action: "Reponer" });
    if (inv.expired.batches > 0) items.push({ key: "expired", tone: "bad", text: `${int(inv.expired.batches)} ${inv.expired.batches === 1 ? "lote vencido" : "lotes vencidos"} (${int(inv.expired.units)} unidades)`, to: "/lotes", action: "Retirar" });
    if (inv.expiringSoon.batches > 0) items.push({ key: "expiring", tone: "warn", text: `${int(inv.expiringSoon.batches)} ${inv.expiringSoon.batches === 1 ? "lote vence" : "lotes vencen"} en ${inv.expiringDays} días`, to: "/lotes", action: "FEFO" });
  }
  if (rec && rec.overdueCustomers > 0) {
    items.push({ key: "overdue", tone: "warn", text: `${int(rec.overdueCustomers)} ${rec.overdueCustomers === 1 ? "cliente con cartera vencida" : "clientes con cartera vencida"} (${money(rec.overdueBalance)})`, to: "/clientes", action: "Cobrar" });
  }
  const loading = inventory.isPending || receivables.isPending;
  const allFailed = inventory.isError && receivables.isError;

  return (
    <Card title="Requiere atención">
      {loading ? (
        <Loading inline />
      ) : allFailed ? (
        <p className={styles.blockError}>No se pudieron cargar los reportes.</p>
      ) : (
        <>
          {items.length === 0 ? <p className={styles.allGood}>Todo en orden: sin faltantes, sin lotes vencidos y sin cartera vencida.</p> : null}
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.key} className={styles.item}>
                <span className={[styles.dot, item.tone === "bad" ? styles.dotBad : styles.dotWarn].join(" ")} aria-hidden="true" />
                <span className={styles.itemText}>{item.text}</span>
                <Link to={item.to} className={[styles.itemLink, item.tone === "bad" ? styles.itemLinkBad : styles.itemLinkWarn].join(" ")}>
                  {item.action}
                </Link>
              </li>
            ))}
          </ul>
          {inventory.isError ? <p className={styles.blockError}>Inventario no disponible.</p> : null}
          {receivables.isError ? <p className={styles.blockError}>Cartera no disponible.</p> : null}
        </>
      )}
    </Card>
  );
};
