import { Modal, QueryState } from "@/components/ui";
import { useChatReceipts } from "@/hooks/chat";
import { dateTime, int } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMessage, ChatReceiptEntry, ChatReceipts } from "@/types/api";
import { Avatar } from "./Avatar";
import { Ticks } from "./Ticks";
import { bodyOrFiles, isAudio, whenLabel } from "./chatFormat";
import styles from "./ReceiptsModal.module.css";

const List = ({ title, hint, entries, time }: { title: string; hint: string; entries: ChatReceiptEntry[]; time: (e: ChatReceiptEntry) => string | null }) => (
  <section className={styles.section}>
    <h3>
      {title} <span>{int(entries.length)}</span>
    </h3>
    {entries.length === 0 ? (
      <p className={styles.none}>{hint}</p>
    ) : (
      <ul>
        {entries.map((e) => {
          const when = time(e);
          return (
            <li key={e.user.id}>
              <Avatar first={e.user.firstName} last={e.user.lastName} size="sm" />
              <span className={styles.who}>
                <strong>
                  {e.user.firstName} {e.user.lastName}
                </strong>
                <small>
                  {ROLE_LABELS[e.user.role]}
                  {e.user.active ? "" : " · cuenta desactivada"}
                </small>
              </span>
              <time dateTime={when ?? undefined}>{when === null ? "aún no" : dateTime(when)}</time>
            </li>
          );
        })}
      </ul>
    )}
  </section>
);

/** Un par de listas: quiénes ya hicieron algo (con fecha y hora) y quiénes faltan ("aún no"). */
const Pair = ({ done, pending, doneTitle, pendingTitle, doneHint, pendingHint, at }: { done: ChatReceiptEntry[]; pending: ChatReceiptEntry[]; doneTitle: string; pendingTitle: string; doneHint: string; pendingHint: string; at: (e: ChatReceiptEntry) => string | null }) => (
  <div className={styles.pair}>
    <List title={doneTitle} hint={doneHint} entries={done} time={at} />
    <List title={pendingTitle} hint={pendingHint} entries={pending} time={() => null} />
  </div>
);

const byName = (a: ChatReceiptEntry, b: ChatReceiptEntry) => a.user.firstName.localeCompare(b.user.firstName, "es");
const byTime = (pick: (e: ChatReceiptEntry) => string | null) => (a: ChatReceiptEntry, b: ChatReceiptEntry) => (pick(b) ?? "").localeCompare(pick(a) ?? "");

/**
 * Detalle de un mensaje propio, en pares: entregado a / falta por entregar, visto por / falta por ver y, si lleva una
 * nota de voz, reproducido por / falta por reproducir; cada persona con fecha y hora. En vivo.
 */
export const ReceiptsModal = ({ message, onClose }: { message: ChatMessage | null; onClose: () => void }) => {
  const receipts = useChatReceipts(message?.id ?? null);
  const audio = message !== null && message.attachments.some((a) => isAudio(a.mime));
  const pairs = (r: ChatReceipts) => {
    const all = [...r.read, ...r.delivered, ...r.pending];
    const delivered = all.filter((e) => e.deliveredAt !== null).sort(byTime((e) => e.deliveredAt));
    const seen = all.filter((e) => e.readAt !== null).sort(byTime((e) => e.readAt));
    const played = all.filter((e) => e.playedAt !== null).sort(byTime((e) => e.playedAt));
    return {
      delivered,
      notDelivered: all.filter((e) => e.deliveredAt === null).sort(byName),
      seen,
      notSeen: all.filter((e) => e.readAt === null).sort(byName),
      played,
      notPlayed: all.filter((e) => e.playedAt === null).sort(byName),
    };
  };
  return (
    <Modal open={message !== null} title="Información del mensaje" description="Se actualiza en vivo a medida que el equipo lo recibe, lo ve y lo escucha." onClose={onClose}>
      {message ? (
        <div className={styles.body}>
          <blockquote className={styles.quote}>
            <p>{bodyOrFiles(message)}</p>
            <footer>
              Enviado {whenLabel(message.createdAt).toLowerCase()} <Ticks receipts={message.receipts} audio={audio} />
            </footer>
          </blockquote>
          <QueryState query={receipts} empty={null}>
            {(r) => {
              const p = pairs(r);
              return (
                <>
                  <Pair doneTitle="Entregado a" pendingTitle="Falta por entregar" doneHint="Aún no le ha llegado a nadie." pendingHint="Le llegó a todos." done={p.delivered} pending={p.notDelivered} at={(e) => e.deliveredAt} />
                  <Pair doneTitle="Visto por" pendingTitle="Falta por ver" doneHint="Nadie lo ha visto todavía." pendingHint="Todos lo vieron." done={p.seen} pending={p.notSeen} at={(e) => e.readAt} />
                  {r.audio || audio ? (
                    <Pair doneTitle="Reproducido por" pendingTitle="Falta por reproducir" doneHint="Nadie ha escuchado la nota de voz todavía." pendingHint="Todos la escucharon." done={p.played} pending={p.notPlayed} at={(e) => e.playedAt} />
                  ) : null}
                </>
              );
            }}
          </QueryState>
        </div>
      ) : null}
    </Modal>
  );
};
