import type { ChatReceiptsSummary } from "@/types/api";
import { int } from "@/lib/format";
import styles from "./Ticks.module.css";

type Local = "sending" | "queued" | "failed" | undefined;

/** Texto del estado de la nota de voz: "reproducido" en privado, "reproducido por todos" o "por N de M" en canal. */
const playedLabel = (r: ChatReceiptsSummary): string => {
  if (r.status === "played") return r.total === 1 ? "reproducido" : `reproducido por todos (${int(r.total)})`;
  return r.total === 1 ? "sin reproducir" : `reproducido por ${int(r.played)} de ${int(r.total)}`;
};

/** Texto del estado para lectores de pantalla y la ayuda emergente. Con `audio`, añade el estado de la nota de voz. */
export const ticksLabel = (local: Local, r: ChatReceiptsSummary | null, audio = false): string => {
  if (local === "sending") return "Enviando";
  if (local === "queued") return "Sin conexión: se enviará solo al volver";
  if (local === "failed") return "No se envió";
  if (!r) return "Enviado";
  if (r.total === 0) return "Enviado (nadie más en la conversación)";
  const base =
    r.status === "played" || r.status === "read"
      ? r.total === 1
        ? "Visto"
        : `Visto por todos (${int(r.total)})`
      : r.status === "delivered"
        ? r.read > 0
          ? `Entregado a todos · visto por ${int(r.read)} de ${int(r.total)}`
          : r.total === 1
            ? "Entregado"
            : `Entregado a todos (${int(r.total)})`
        : r.delivered > 0
          ? `Enviado · entregado a ${int(r.delivered)} de ${int(r.total)}`
          : "Enviado";
  return audio ? `${base} · ${playedLabel(r)}` : base;
};

/** Micrófono junto a los chulitos de una nota de voz: verde cuando todos la reprodujeron, gris mientras tanto. */
const Mic = ({ played }: { played: boolean }) => (
  <svg className={[styles.mic, played ? styles.read : ""].join(" ")} viewBox="0 0 16 16" aria-hidden="true">
    <rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="currentColor" />
    <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5M5.5 14.5h5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/**
 * Chulitos del mensaje propio: reloj (enviando), uno gris (enviado), dos grises (entregado a todos) y dos verdes
 * (visto por todos). En el canal general, si solo algunos lo han visto, los dos chulitos van grises con el conteo.
 * Con `audio` (nota de voz) se añade un micrófono que pasa a verde cuando todos la reprodujeron.
 */
export const Ticks = ({ local, receipts, audio = false }: { local?: Local; receipts: ChatReceiptsSummary | null; audio?: boolean }) => {
  const label = ticksLabel(local, receipts, audio);
  if (local === "sending" || local === "queued")
    return (
      <svg className={styles.ticks} viewBox="0 0 16 16" role="img" aria-label={label}>
        <circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 5v3.2l2 1.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  if (local === "failed")
    return (
      <svg className={[styles.ticks, styles.failed].join(" ")} viewBox="0 0 16 16" role="img" aria-label={label}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 4.8v3.8M8 10.8v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  const status = receipts?.status ?? "sent";
  const double = status !== "sent";
  const seen = status === "read" || status === "played";
  return (
    <span className={styles.group} role="img" aria-label={label}>
      {audio ? <Mic played={status === "played"} /> : null}
      <svg className={[styles.ticks, double ? styles.double : "", seen ? styles.read : ""].join(" ")} viewBox={double ? "0 0 22 16" : "0 0 16 16"} aria-hidden="true">
        <path d="M2.5 8.5 6 12l7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {double ? <path d="M9 12l7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 0)" /> : null}
      </svg>
    </span>
  );
};
