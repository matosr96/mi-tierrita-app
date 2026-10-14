import { useState, type ReactNode } from "react";
import { useSessionStore } from "@/stores/session";
import { useSales } from "@/hooks/sales";
import { useSalesReport } from "@/hooks/reports";
import { PageHeader } from "@/components/layout/AppShell";
import { addDaysIso, dateOnly, todayIso } from "@/lib/format";
import type { SaleQuery, SaleStatus } from "@/types/api";
import { SaleDetailModal } from "./SaleDetailModal";
import { SalesFilterBar } from "./SalesFilterBar";
import { SaleTimeline } from "./SaleTimeline";
import { PeriodLedger } from "./PeriodLedger";
import styles from "./SalesHistory.module.css";

/**
 * CU-10 Consultar ventas: barra de filtros, línea de tiempo de tickets agrupados por día y, al lado,
 * el cierre del período (indicadores y ventas por día tal como los devuelve el reporte de ventas).
 */
export const SalesHistory = ({ tabs }: { tabs: ReactNode }) => {
  const user = useSessionStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  const [from, setFrom] = useState(() => todayIso());
  const [to, setTo] = useState(() => todayIso());
  const [status, setStatus] = useState<SaleStatus | "">("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const report = useSalesReport({ from, to, groupBy: "day" });

  const query: SaleQuery = { page, limit: 20, from, to };
  if (status) query.status = status;
  if (customerId !== null) query.customerId = customerId;
  if (isAdmin && userId !== null) query.userId = userId;
  const sales = useSales(query);

  const singleDay = from === to;
  const periodLabel = singleDay ? `Registro del día · ${dateOnly(from)}` : `Registro del período · ${dateOnly(from)} – ${dateOnly(to)}`;

  /** Cualquier cambio de filtro vuelve a la primera página. */
  const change =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const setPeriod = (days: number) => {
    setFrom(addDaysIso(todayIso(), -days));
    setTo(todayIso());
    setPage(1);
  };
  const clearFilters = () => {
    setStatus("");
    setCustomerId(null);
    setUserId(null);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Ventas" subtitle={periodLabel} actions={tabs} />

      <SalesFilterBar
        from={from}
        to={to}
        status={status}
        customerId={customerId}
        userId={userId}
        showUser={isAdmin}
        onFrom={change(setFrom)}
        onTo={change(setTo)}
        onStatus={change(setStatus)}
        onCustomer={change(setCustomerId)}
        onUser={change(setUserId)}
        onPeriod={setPeriod}
        onClear={clearFilters}
      />

      <div className={styles.layout}>
        <div className={styles.timeline}>
          <SaleTimeline query={sales} singleDay={singleDay} onOpen={setSelectedId} onPage={setPage} onPeriod={setPeriod} />
        </div>
        <div className={styles.ledger}>
          <PeriodLedger report={report} from={from} to={to} />
        </div>
      </div>

      <SaleDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
};
