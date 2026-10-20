import { Modal, QueryState } from "@/components/ui";
import { useChatReceipts } from "@/hooks/chat";
import { int } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMessage, ChatReceiptEntry } from "@/types/api";
import { Avatar } from "./Avatar";
import { Ticks } from "./Ticks";
import { whenLabel } from "./chatFormat";
import styles from "./ReceiptsModal.module.css";

const Section = ({ title, hint, entries, time }: { title: string; hint: string; entries: ChatReceiptEntry[]; time: (e: ChatReceiptEntry) => string | null }) => (
  <section className={styles.section}>
    <h3>
      {title} <span>{int(entries.length)}</span>
    </h3>
    {entries.length === 0 ? (
      <p className={styles.none}>{hint}</p>
    ) : (
      <ul>
        {entries.map((e) => (
          <li key={e.user.id}>
            <Avatar first={e.user.firstName} last={e.user.lastName} />
            <span className={styles.who}>
              <strong>
                {e.user.firstName} {e.user.lastName}
              </strong>
              <small>
                {ROLE_LABELS[e.user.role]}
                {e.user.active ? "" : " · cuenta desactivada"}
              </small>
            </span>
            {time(e) ? <time>{time(e)}</time> : null}
          </li>
        ))}
      </ul>
    )}
  </section>
);

/** Detalle de un mensaje propio: quién lo leyó y cuándo, a quién le llegó sin leerlo y quién sigue pendiente. En vivo. */
export const ReceiptsModal = ({ message, onClose }: { message: ChatMessage | null; onClose: () => void }) => {
  const receipts = useChatReceipts(message?.id ?? null);
  return (
    <Modal open={message !== null} title="Información del mensaje" description="Se actualiza en vivo a medida que el equipo lo recibe y lo lee." onClose={onClose}>
      {message ? (
        <div className={styles.body}>
          <blockquote className={styles.quote}>
            <p>{message.body || `📎 ${message.attachments.map((a) => a.name).join(", ")}`}</p>
            <footer>
              Enviado {whenLabel(message.createdAt).toLowerCase()} <Ticks receipts={message.receipts} />
            </footer>
          </blockquote>
          <QueryState query={receipts} empty={null}>
            {(r) => (
              <>
                <Section title="Leído por" hint="Nadie lo ha leído todavía." entries={r.read} time={(e) => (e.readAt ? `Visto ${whenLabel(e.readAt).toLowerCase()}` : null)} />
                <Section title="Entregado a" hint="No hay entregas sin leer." entries={r.delivered} time={(e) => (e.deliveredAt ? `Recibido ${whenLabel(e.deliveredAt).toLowerCase()}` : null)} />
                <Section title="Pendiente" hint="Le llegó a todos." entries={r.pending} time={() => "Aún no abre la app"} />
              </>
            )}
          </QueryState>
        </div>
      ) : null}
    </Modal>
  );
};
