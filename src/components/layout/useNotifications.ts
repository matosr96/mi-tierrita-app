import { useExpiringBatches } from "@/hooks/batches";
import { useCustomers } from "@/hooks/customers";
import { useProducts } from "@/hooks/products";
import { useInventoryReport, useReceivablesReport } from "@/hooks/reports";
import { useContactMessages } from "@/hooks/contact";
import { useChatTeam } from "@/hooks/chat";
import { useDueNotices } from "@/hooks/notifications";
import { useAlarmFires } from "@/hooks/alarms";
import { areaPath } from "@/screens/Alarms/alarmLabels";
import { todayIso } from "@/lib/format";
import { int } from "@/lib/format";
import { useNotificationsStore } from "@/stores/notifications";
import { useSessionStore } from "@/stores/session";
import { adminAttention, pendingItems, todoItems } from "@/screens/Home/attention";
import type { AttentionItem } from "@/screens/Home/attention";

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
  // Chat: sin leer y menciones (misma caché que la insignia del menú, refrescada por los avisos en vivo).
  const chat = useChatTeam(30_000, { enabled: role !== undefined });
  const chatUnread = chat.data?.unreadTotal ?? 0;
  const chatMentions = chat.data ? chat.data.general.mentions + chat.data.members.reduce((n, m) => n + m.mentions, 0) : 0;
  const chatItem: AttentionItem[] =
    chatUnread > 0
      ? [
          {
            key: "chat",
            tone: chatMentions > 0 ? "warn" : "neutral",
            text: `${int(chatUnread)} ${chatUnread === 1 ? "mensaje sin leer" : "mensajes sin leer"} en el chat${chatMentions > 0 ? ` (${int(chatMentions)} ${chatMentions === 1 ? "mención" : "menciones"})` : ""}`,
            to: "/chat",
            tag: "Leer",
          },
        ]
      : [];
  const roleItems: AttentionItem[] = isAdmin
    ? [...contactItem, ...adminAttention(inventory.data, receivables.data)]
    : role === "SALES"
      ? pendingItems(customers.data?.items ?? [])
      : role === "WAREHOUSE"
        ? todoItems(expiring.data?.items ?? [], products.data?.items ?? [])
        : [];
  // Avisos de vencimiento calculados en el servidor según el rol (lotes y cartera) y alarmas que sonaron hoy.
  const due = useDueNotices({ enabled: role !== undefined });
  const dueItems: AttentionItem[] = (due.data?.items ?? []).map((d) => ({
    key: `due-${d.kind}-${d.id}`,
    tone: d.kind === "batch_expired" || d.kind === "receivable_overdue" ? "bad" : "warn",
    text: `${d.title}: ${d.detail}`,
    to: d.href,
    tag: d.kind.startsWith("batch_") ? "Lotes" : "Cobrar",
  }));
  const fires = useAlarmFires({ limit: 20 }, { enabled: role !== undefined });
  const today = todayIso();
  const alarmItems: AttentionItem[] = (fires.data?.items ?? [])
    .filter((f) => new Date(f.firedAt).toLocaleDateString("en-CA") === today)
    .map((f) => ({ key: `alarm-${f.id}`, tone: "neutral", text: `Alarma «${f.title}» sonó a las ${new Date(f.firedAt).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}`, to: areaPath(f.area), tag: "Alarma" }));
  const items = [...alarmItems, ...chatItem, ...dueItems, ...roleItems];
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
