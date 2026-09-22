import { useCustomers } from "@/hooks/customers";
import { useReceivablesReport } from "@/hooks/reports";
import { StatCard, StatGrid } from "@/components/ui";
import { int, moneyCompact } from "@/lib/format";

/** Indicadores de cartera del lienzo "Clientes" (ADMIN, CU-20). GET /reports/receivables no está permitido para SALES. */
export const AdminStats = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const report = useReceivablesReport();
  const r = report.data;
  const pending = report.isPending ? "…" : "—";
  const unavailable = report.isError ? "No disponible" : undefined;

  return (
    <StatGrid>
      <StatCard label="Cartera total" value={r ? moneyCompact(r.totalBalance) : pending} hint={r ? `${int(r.customersWithBalance)} ${r.customersWithBalance === 1 ? "cliente" : "clientes"} con crédito` : unavailable} />
      <StatCard
        label="Cartera vencida"
        tone={r && r.overdueBalance > 0 ? "bad" : "neutral"}
        value={r ? moneyCompact(r.overdueBalance) : pending}
        hint={r ? `más de ${int(r.overdueDays)} días sin abonar` : unavailable}
      />
      <StatCard label="Clientes activos" value={active.data ? int(active.data.count) : active.isPending ? "…" : "—"} hint="habilitados para comprar" />
      <StatCard label="Con cartera vencida" tone={r && r.overdueCustomers > 0 ? "bad" : "neutral"} value={r ? int(r.overdueCustomers) : pending} hint={r ? "requieren gestión de cobro" : unavailable} />
    </StatGrid>
  );
};
