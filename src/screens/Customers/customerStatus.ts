import type { Customer, ReceivableRow } from "@/types/api";

export type CustomerStatus = "inactive" | "overdue" | "over" | "balance" | "clear";

/** Estado con la misma prioridad del lienzo: Inactivo, Vencida (reporte), Excedió cupo, Con saldo, Al día. */
export const customerStatusOf = (c: Customer, row: ReceivableRow | undefined): CustomerStatus => {
  if (!c.active) return "inactive";
  if (row?.overdue) return "overdue";
  if (c.availableCredit < 0) return "over";
  if (c.balance > 0) return "balance";
  return "clear";
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, { text: string; tone: "neutral" | "good" | "warn" | "bad" }> = {
  inactive: { text: "Inactivo", tone: "neutral" },
  overdue: { text: "Vencida", tone: "bad" },
  over: { text: "Excedió cupo", tone: "bad" },
  balance: { text: "Con saldo", tone: "warn" },
  clear: { text: "Al día", tone: "good" },
};
