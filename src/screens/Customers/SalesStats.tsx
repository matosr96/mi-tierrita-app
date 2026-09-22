import { useCustomers } from "@/hooks/customers";
import { StatCard, StatGrid } from "@/components/ui";
import { int } from "@/lib/format";

/** Indicadores de la Secretaria: solo cuentas del listado (no consulta el reporte de cartera). */
export const SalesStats = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const withBalance = useCustomers({ withBalance: true, limit: 1 });
  const value = (q: typeof active) => (q.data ? int(q.data.count) : q.isPending ? "…" : "—");

  return (
    <StatGrid>
      <StatCard label="Clientes activos" value={value(active)} hint="habilitados para comprar" />
      <StatCard label="Clientes con saldo" tone={withBalance.data && withBalance.data.count > 0 ? "warn" : "neutral"} value={value(withBalance)} hint="deben algo a la fecha" />
    </StatGrid>
  );
};
