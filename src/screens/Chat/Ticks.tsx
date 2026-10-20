import type { ChatReceiptsSummary } from "@/types/api";
import { int } from "@/lib/format";
import styles from "./Ticks.module.css";

/** Texto del estado para lectores de pantalla y la ayuda emergente. */
export const ticksLabel = (local: "sending" | "queued" | "failed" | undefined, r: ChatReceiptsSummary | null): string => {
  if (local === "sending") return "Enviando";
  if (local === "queued") return "Sin conexión: se enviará solo al volver";
  if (local === "failed") return "No se envió";
  if (!r) return "Enviado";
  if (r.total === 0) return "Enviado (nadie más en la conversación)";
  if (r.status === "read") return r.total === 1 ? "Visto" : `Visto por todos (${int(r.total)})`;
  if (r.status === "delivered") return r.read > 0 ? `Entregado a todos · visto por ${int(r.read)} de ${int(r.total)}` : r.total === 1 ? "Entregado" : `Entregado a todos (${int(r.total)})`;
  return r.delivered > 0 ? `Enviado · entregado a ${int(r.delivered)} de ${int(r.total)}` : "Enviado";
};

/**
 * Chulitos del mensaje propio: reloj (enviando), uno gris (enviado), dos grises (entregado a todos) y dos verdes
 * (visto por todos). En el canal general, si solo algunos lo han visto, los dos chulitos van grises con el conteo.
 */
export const Ticks = ({ local, receipts }: { local?: "sending" | "queued" | "failed" | undefined; receipts: ChatReceiptsSummary | null }) => {
  const label = ticksLabel(local, receipts);
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
  return (
    <svg className={[styles.ticks, double ? styles.double : "", status === "read" ? styles.read : ""].join(" ")} viewBox={double ? "0 0 22 16" : "0 0 16 16"} role="img" aria-label={label}>
      <path d="M2.5 8.5 6 12l7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {double ? <path d="M9 12l7-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(3 0)" /> : null}
    </svg>
  );
};
