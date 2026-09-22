import { Card, Loading } from "@/components/ui";
import { int, money } from "@/lib/format";
import type { InventoryReport, ReceivablesReport } from "@/types/api";
import { AttentionList, type AttentionItem } from "./AttentionList";
import styles from "./HomeScreen.module.css";

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean };
type Props = { inventory: QueryLike<InventoryReport>; receivables: QueryLike<ReceivablesReport> };

/** "Requiere atención" del administrador, a partir de los reportes de inventario y cartera. */
export const AttentionCard = ({ inventory, receivables }: Props) => {
  const items: AttentionItem[] = [];
  const inv = inventory.data;
  const rec = receivables.data;
  if (inv) {
    if (inv.expired.batches > 0) {
      items.push({ key: "expired", tone: "bad", text: `${int(inv.expired.batches)} ${inv.expired.batches === 1 ? "lote vencido" : "lotes vencidos"} en bodega`, to: "/lotes", tag: money(inv.expired.costValue) });
    }
    if (inv.expiringSoon.batches > 0) {
      items.push({ key: "expiring", tone: "bad", text: `${int(inv.expiringSoon.batches)} ${inv.expiringSoon.batches === 1 ? "lote vence" : "lotes vencen"} en ${inv.expiringDays} días`, to: "/lotes", tag: money(inv.expiringSoon.costValue) });
    }
    if (inv.outOfStock > 0) {
      items.push({ key: "stock", tone: "warn", text: `${int(inv.outOfStock)} ${inv.outOfStock === 1 ? "producto sin existencias" : "productos sin existencias"}`, to: "/inventario", tag: "Reponer" });
    }
  }
  if (rec && rec.overdueCustomers > 0) {
    items.push({ key: "overdue", tone: "warn", text: `${int(rec.overdueCustomers)} ${rec.overdueCustomers === 1 ? "cliente con cartera vencida" : "clientes con cartera vencida"}`, to: "/clientes", tag: money(rec.overdueBalance) });
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
          {items.length === 0 ? <p className={styles.allGood}>Todo en orden: sin faltantes, sin lotes vencidos y sin cartera vencida.</p> : <AttentionList items={items} />}
          {inventory.isError ? <p className={styles.blockError}>Inventario no disponible.</p> : null}
          {receivables.isError ? <p className={styles.blockError}>Cartera no disponible.</p> : null}
        </>
      )}
    </Card>
  );
};
