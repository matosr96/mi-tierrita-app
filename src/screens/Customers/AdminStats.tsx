import { useCustomers } from "@/hooks/customers";
import { useReceivablesReport } from "@/hooks/reports";
import { StatCard, StatGrid } from "@/components/ui";
import { int, moneyCompact } from "@/lib/format";

/** Indicadores de cartera del administrador (CU-20). GET /reports/receivables no está permitido para SALES. */
export const AdminStats = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const report = useReceivablesReport();
  const r = report.data;
  const pending = report.isPending ? "…" : "—";

  return (
    <StatGrid>
      <StatCard label="Clientes activos" value={active.data ? int(active.data.count) : active.isPending ? "…" : "—"} hint="habilitados para comprar" />
      <StatCard label="Cartera total" value={r ? moneyCompact(r.totalBalance) : pending} hint={r ? `${int(r.customersWithBalance)} ${r.customersWithBalance === 1 ? "cliente" : "clientes"} con crédito` : report.isError ? "No disponible" : undefined} />
      <StatCard
        label="Cartera vencida"
        tone={r && r.overdueBalance > 0 ? "bad" : "neutral"}
        value={r ? moneyCompact(r.overdueBalance) : pending}
        hint={r ? `${int(r.overdueCustomers)} ${r.overdueCustomers === 1 ? "cliente" : "clientes"} · más de ${int(r.overdueDays)} días sin abonar` : report.isError ? "No disponible" : undefined}
      />
      <StatCard label="Clientes con saldo" tone={r && r.customersWithBalance > 0 ? "warn" : "neutral"} value={r ? int(r.customersWithBalance) : pending} hint="deben algo a la fecha" />
    </StatGrid>
  );
};
