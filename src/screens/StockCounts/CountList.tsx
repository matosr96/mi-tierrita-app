import { Badge, Button, EmptyState, Pagination, QueryState } from "@/components/ui";
import { useStockCounts } from "@/hooks/stock-counts";
import { dateOnly, int } from "@/lib/format";
import type { StockCount, StockCountStatus } from "@/types/api";
import { STATUS_LABELS, STATUS_ORDER, STATUS_TONES, scopeLabel } from "./stockCountLabels";
import styles from "./StockCountsScreen.module.css";

type Props = { status: StockCountStatus | "ALL"; page: number; onPage: (page: number) => void; onOpen: (id: number) => void; onCreate: () => void };

const DUE_LABELS = { OVERDUE: "Atrasado", TODAY: "Para hoy" } as const;

const CountCard = ({ count, onOpen }: { count: StockCount; onOpen: (id: number) => void }) => {
  const dueClass = count.due === "OVERDUE" ? styles.cardOverdue : count.due === "TODAY" ? styles.cardToday : "";
  return (
    <button type="button" className={[styles.card, dueClass].join(" ")} onClick={() => onOpen(count.id)}>
      <span className={styles.cardMain}>
        <span className={styles.cardTitle}>{count.title}</span>
        <span className={styles.cardMeta}>
          {dateOnly(count.scheduledDate)} · {scopeLabel(count)}
        </span>
      </span>
      <span className={styles.cardSide}>
        {count.due === "OVERDUE" || count.due === "TODAY" ? <Badge tone={count.due === "OVERDUE" ? "bad" : "warn"}>{DUE_LABELS[count.due]}</Badge> : null}
        <Badge tone={STATUS_TONES[count.status]}>{STATUS_LABELS[count.status]}</Badge>
        {count.totalLines > 0 ? (
          <span className={styles.cardProgress}>
            {int(count.countedLines)} de {int(count.totalLines)} contados
          </span>
        ) : null}
      </span>
    </button>
  );
};

/** Conteos agrupados por estado; los programados para hoy o atrasados se resaltan (la API dice cuáles con `due`). */
export const CountList = ({ status, page, onPage, onOpen, onCreate }: Props) => {
  const counts = useStockCounts({ page, limit: 20, ...(status === "ALL" ? {} : { status }) });
  return (
    <QueryState
      query={counts}
      isEmpty={(p) => p.items.length === 0}
      empty={
        <EmptyState
          title={status === "ALL" ? "Todavía no hay conteos" : `No hay conteos en estado «${STATUS_LABELS[status].toLowerCase()}»`}
          text="Programe un conteo de todo el inventario o de una categoría para comparar lo que hay en bodega con lo que dice el sistema."
          action={<Button onClick={onCreate}>Programar conteo</Button>}
        />
      }
    >
      {(p) => (
        <div className={styles.groups}>
          {STATUS_ORDER.map((s) => {
            const items = p.items.filter((c) => c.status === s);
            if (items.length === 0) return null;
            return (
              <section key={s} className={styles.group} aria-label={STATUS_LABELS[s]}>
                <h2 className={styles.groupTitle}>{STATUS_LABELS[s]}</h2>
                <div className={styles.cards}>
                  {items.map((c) => (
                    <CountCard key={c.id} count={c} onOpen={onOpen} />
                  ))}
                </div>
              </section>
            );
          })}
          <Pagination page={p} onPage={onPage} />
        </div>
      )}
    </QueryState>
  );
};
