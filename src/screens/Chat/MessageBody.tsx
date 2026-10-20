import type { ReactNode } from "react";
import type { ChatMention } from "@/types/api";
import styles from "./MessageBody.module.css";

const TOKENS = /(https?:\/\/[^\s<>"]+[^\s<>".,;:!?)])|(^|[\s(¿¡,;:])@([a-z0-9._-]{2,50})/gi;
const EVERYONE = new Set(["todos", "equipo"]);

/**
 * Texto de un mensaje (siempre como texto, nunca HTML): resalta las menciones que el servidor reconoció (y la propia
 * con más fuerza) y convierte los enlaces http(s) en vínculos que abren en otra pestaña.
 */
export const MessageBody = ({ body, mentions, myUsername, general }: { body: string; mentions: ChatMention[]; myUsername: string | undefined; general: boolean }) => {
  const known = new Set(mentions.map((m) => m.username.toLowerCase()));
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of body.matchAll(TOKENS)) {
    const start = match.index ?? 0;
    if (match[1]) {
      parts.push(body.slice(last, start));
      parts.push(
        <a key={start} href={match[1]} target="_blank" rel="noopener noreferrer" className={styles.link}>
          {match[1]}
        </a>,
      );
      last = start + match[1].length;
      continue;
    }
    const lead = match[2] ?? "";
    const user = (match[3] ?? "").replace(/[.]+$/, "");
    const lower = user.toLowerCase();
    const isEveryone = general && EVERYONE.has(lower);
    if (!known.has(lower) && !isEveryone) continue;
    const at = start + lead.length;
    parts.push(body.slice(last, at));
    const mine = lower === myUsername?.toLowerCase() || isEveryone;
    parts.push(
      <span key={at} className={[styles.mention, mine ? styles.me : ""].join(" ")}>
        @{user}
      </span>,
    );
    last = at + 1 + user.length;
  }
  parts.push(body.slice(last));
  return <>{parts}</>;
};
