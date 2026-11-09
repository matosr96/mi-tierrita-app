import { useCustomerBalance } from "@/hooks/customers";
import { Badge } from "@/components/ui";
import { int } from "@/lib/format";
import { CUSTOMER_STATUS_LABEL, type CustomerStatus } from "./customerStatus";

/** Los días sin abonar los da GET /customers/:id/balance; solo se pide para las filas vencidas. */
const OverdueBadge = ({ id }: { id: number }) => {
  const balance = useCustomerBalance(id);
  return <Badge tone="bad">{balance.data ? `Vencida · ${int(balance.data.overdueDays)} días` : "Vencida"}</Badge>;
};

/**
 * Sin el reporte de cartera (solo ADMIN), «Con saldo» no distingue lo vencido: la secretaria, que es quien cobra, veía
 * «Con saldo» en clientes con 30 días o más sin abonar. Aquí se confirma con el saldo del cliente, que su rol sí consulta.
 */
const BalanceBadge = ({ id }: { id: number }) => {
  const balance = useCustomerBalance(id);
  if (balance.data?.overdue) return <Badge tone="bad">{`Vencida · ${int(balance.data.overdueDays)} días`}</Badge>;
  return <Badge tone={CUSTOMER_STATUS_LABEL.balance.tone}>{CUSTOMER_STATUS_LABEL.balance.text}</Badge>;
};

/** Insignia del estado de cartera del cliente (lista, tarjetas y tabla). `verify`: no hubo reporte de cartera que lo dijera. */
export const CustomerStatusBadge = ({ id, status, verify = false }: { id: number; status: CustomerStatus; verify?: boolean }) =>
  status === "overdue" ? (
    <OverdueBadge id={id} />
  ) : verify && status === "balance" ? (
    <BalanceBadge id={id} />
  ) : (
    <Badge tone={CUSTOMER_STATUS_LABEL[status].tone}>{CUSTOMER_STATUS_LABEL[status].text}</Badge>
  );
