import { useCustomerBalance } from "@/hooks/customers";
import { Badge } from "@/components/ui";
import { int } from "@/lib/format";
import { CUSTOMER_STATUS_LABEL, type CustomerStatus } from "./customerStatus";

/** Los días sin abonar los da GET /customers/:id/balance; solo se pide para las filas vencidas. */
const OverdueBadge = ({ id }: { id: number }) => {
  const balance = useCustomerBalance(id);
  return <Badge tone="bad">{balance.data ? `Vencida · ${int(balance.data.overdueDays)} días` : "Vencida"}</Badge>;
};

/** Insignia del estado de cartera del cliente (lista, tarjetas y tabla). */
export const CustomerStatusBadge = ({ id, status }: { id: number; status: CustomerStatus }) =>
  status === "overdue" ? <OverdueBadge id={id} /> : <Badge tone={CUSTOMER_STATUS_LABEL[status].tone}>{CUSTOMER_STATUS_LABEL[status].text}</Badge>;
