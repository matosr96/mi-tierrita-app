import { Card, EmptyState, ErrorState, Loading } from "@/components/ui";
import { int } from "@/lib/format";
import type { Page, ProductBatch } from "@/types/api";
import styles from "./BatchesScreen.module.css";

type Query = { data: Page<ProductBatch> | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
type Tile = { label: string; value: number; tone: string | undefined };

/** "Distribución · Lotes por urgencia": mosaico de conteos por tramo de vencimiento dentro de la ventana. */
export const DistributionCard = ({ days, query, note }: { days: number; query: Query; note: string }) => {
  const items = query.data?.items ?? [];
  const upcoming = items.filter((b) => !b.expired);
  const tiles: Tile[] = [
    { label: "Vencidos", value: items.length - upcoming.length, tone: styles.tileBad },
    { label: `≤ ${Math.min(days, 30)} días`, value: upcoming.filter((b) => b.daysToExpire <= 30).length, tone: styles.tileBad },
    ...(days > 30 ? [{ label: `31 a ${Math.min(days, 60)}`, value: upcoming.filter((b) => b.daysToExpire > 30 && b.daysToExpire <= 60).length, tone: styles.tileWarn }] : []),
    ...(days > 60 ? [{ label: `61 a ${days}`, value: upcoming.filter((b) => b.daysToExpire > 60).length, tone: styles.tileMuted }] : []),
  ];

  return (
    <Card title="Distribución" subtitle="Lotes por urgencia">
      {query.isPending ? (
        <Loading inline />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Sin lotes en la ventana" text={`Ningún lote vence en los próximos ${days} días.`} />
      ) : (
        <>
          <div className={styles.tiles}>
            {tiles.map((t) => (
              <div key={t.label} className={[styles.tile, t.tone].join(" ")}>
                <div className={styles.tileLabel}>{t.label}</div>
                <div className={styles.tileValue}>{int(t.value)}</div>
              </div>
            ))}
          </div>
          <p className={styles.note}>{note}</p>
        </>
      )}
    </Card>
  );
};
