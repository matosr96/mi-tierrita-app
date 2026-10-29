import { int } from "@/lib/format";
import { ROLE_LABELS } from "@/stores/session";
import type { ChatMember, User } from "@/types/api";
import { Avatar } from "./Avatar";
import { presenceLabel } from "./chatFormat";
import styles from "./TeamPanel.module.css";

/** Panel "Equipo": quién está "Activo ahora" y quién no (con "Últ. vez hace…"); un clic abre el privado. */
export const TeamPanel = ({ me, members, onOpen }: { me: User | null; members: ChatMember[]; onOpen: (id: number) => void }) => {
  const online = members.filter((m) => m.online);
  const offline = members.filter((m) => !m.online);
  const row = (m: ChatMember) => (
    <li key={m.id}>
      <button type="button" className={styles.btn} onClick={() => onOpen(m.id)} title={`Escribirle a ${m.firstName}`}>
        <Avatar first={m.firstName} last={m.lastName} online={m.online} />
        <span>
          <strong>
            {m.firstName} {m.lastName}
          </strong>
          <small>
            {ROLE_LABELS[m.role]} · {presenceLabel(m.online, m.lastSeenAt)}
          </small>
        </span>
      </button>
    </li>
  );
  return (
    <aside className={styles.team} aria-label="Equipo">
      <h3>Equipo</h3>
      <span className={styles.label}>En línea · {int(online.length + 1)}</span>
      <ul>
        {me ? (
          <li>
            <Avatar first={me.firstName} last={me.lastName} online />
            <span>
              <strong>
                {me.firstName} {me.lastName} (usted)
              </strong>
              <small>{ROLE_LABELS[me.role]} · Activo ahora</small>
            </span>
          </li>
        ) : null}
        {online.map(row)}
      </ul>
      <span className={styles.label}>Desconectados · {int(offline.length)}</span>
      <ul>{offline.map(row)}</ul>
    </aside>
  );
};
