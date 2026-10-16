import { useExpiringBatches } from "@/hooks/batches";
import { useCustomers } from "@/hooks/customers";
import { useProducts } from "@/hooks/products";
import { useInventoryReport, useReceivablesReport } from "@/hooks/reports";
import { useContactMessages } from "@/hooks/contact";
import { int } from "@/lib/format";
import { useNotificationsStore } from "@/stores/notifications";
import { useSessionStore } from "@/stores/session";
import { adminAttention, pendingItems, todoItems } from "@/screens/Home/attention";
import type { AttentionItem } from "@/screens/Home/AttentionList";

export type Notification = AttentionItem & { id: string; unread: boolean };

/**
 * Notificaciones de la campana: los mismos pendientes del Inicio de cada rol (comparten caché con él), marcados como
 * leídos o no según lo que la persona ya abrió en este navegador.
 */
export const useNotifications = () => {
  const role = useSessionStore((s) => s.user?.role);
  const seen = useNotificationsStore((s) => s.seen);
  const markSeen = useNotificationsStore((s) => s.markSeen);
  const isAdmin = role === "ADMIN";
  const inventory = useInventoryReport(30, { enabled: isAdmin });
  const receivables = useReceivablesReport(30, { enabled: isAdmin });
  const contacts = useContactMessages({ status: "NEW", limit: 1 }, { enabled: isAdmin });
  const customers = useCustomers({ withBalance: true, limit: 5 }, { enabled: role === "SALES" });
  const products = useProducts({ limit: 100, active: true }, { enabled: role === "WAREHOUSE" });
  const expiring = useExpiringBatches({ days: 30, limit: 100 }, { enabled: role === "WAREHOUSE" });

  const newContacts = contacts.data?.count ?? 0;
  const contactItem: AttentionItem[] =
    newContacts > 0
      ? [{ key: "contact", tone: "neutral", text: `${int(newContacts)} ${newContacts === 1 ? "mensaje nuevo" : "mensajes nuevos"} desde la página pública`, to: "/contactos", tag: "Responder" }]
      : [];
  const items: AttentionItem[] = isAdmin
    ? [...contactItem, ...adminAttention(inventory.data, receivables.data)]
    : role === "SALES"
      ? pendingItems(customers.data?.items ?? [])
      : role === "WAREHOUSE"
        ? todoItems(expiring.data?.items ?? [], products.data?.items ?? [])
        : [];
  const isPending = isAdmin ? inventory.isPending || receivables.isPending : role === "SALES" ? customers.isPending : products.isPending || expiring.isPending;

  const list: Notification[] = items.map((n) => {
    const id = `${n.key}|${n.text}`;
    return { ...n, id, unread: !seen.includes(id) };
  });
  return {
    items: list,
    unread: list.filter((n) => n.unread).length,
    isPending,
    markAllRead: () => markSeen(list.map((n) => n.id)),
    markRead: (id: string) => markSeen([id]),
  };
};
