import { Card, Loading } from "@/components/ui";
import type { InventoryReport, ReceivablesReport } from "@/types/api";
import { AttentionList } from "./AttentionList";
import { adminAttention } from "./attention";
import styles from "./HomeScreen.module.css";

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean };
type Props = { inventory: QueryLike<InventoryReport>; receivables: QueryLike<ReceivablesReport> };

/** "Requiere atención" del administrador, a partir de los reportes de inventario y cartera. */
export const AttentionCard = ({ inventory, receivables }: Props) => {
  const items = adminAttention(inventory.data, receivables.data);
  const loading = inventory.isPending || receivables.isPending;
  const allFailed = inventory.isError && receivables.isError;

  return (
    <Card title="Requiere atención" subtitle="Pendientes de hoy">
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
