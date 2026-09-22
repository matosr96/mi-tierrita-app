import { useCustomers } from "@/hooks/customers";
import { StatCard, StatGrid } from "@/components/ui";
import { int } from "@/lib/format";

/** Indicadores de la secretaria (lienzo "SecClientes"): solo cuentas del listado, el reporte de cartera es de ADMIN. */
export const SalesStats = () => {
  const active = useCustomers({ active: true, limit: 1 });
  const withBalance = useCustomers({ withBalance: true, limit: 1 });
  const value = (q: typeof active) => (q.data ? int(q.data.count) : q.isPending ? "…" : "—");
  const hint = (q: typeof active, text: string) => (q.isError ? "No disponible" : text);

  return (
    <StatGrid>
      <StatCard label="Clientes activos" value={value(active)} hint={hint(active, "habilitados para comprar")} />
      <StatCard label="Clientes con crédito" tone={withBalance.data && withBalance.data.count > 0 ? "warn" : "neutral"} value={value(withBalance)} hint={hint(withBalance, "con saldo pendiente")} />
    </StatGrid>
  );
};
