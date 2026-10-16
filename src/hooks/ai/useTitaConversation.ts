import { useQueryClient } from "@tanstack/react-query";
import { aiService, executeAiAction } from "@/services/ai";
import { toApiError } from "@/lib/errors";
import { useAiStore, type AiMessage } from "@/stores/ai";
import type { AiAction, AiAttachment, AiChatTurn } from "@/types/api";

/** Resumen corto de lo que devolvió la API al ejecutar una tarjeta (para la nota y para que Tita lo sepa). */
const outcome = (data: unknown): string => {
  if (!data || typeof data !== "object") return "listo";
  const d = data as Record<string, unknown>;
  if (typeof d["invoiceNumber"] === "string") return `factura ${d["invoiceNumber"]}, total $ ${Number(d["total"]).toLocaleString("es-CO")}`;
  if (typeof d["balanceAfter"] === "number") return `saldo después del abono $ ${d["balanceAfter"].toLocaleString("es-CO")}`;
  if (typeof d["id"] === "number") return `id ${d["id"]}`;
  return "listo";
};

/** Cómo quedó cada tarjeta, para que Tita no repita ni dé por hecho lo que la persona no confirmó. */
const CARD_STATUS = { idle: "pendiente de confirmar", running: "registrándose", done: "confirmada y registrada", failed: "falló", dismissed: "descartada" } as const;

/**
 * La conversación como turnos para la API: las notas del sistema (acciones confirmadas) se anteponen a la siguiente
 * pregunta; solo la última pregunta lleva sus adjuntos completos.
 */
const toTurns = (messages: AiMessage[]): AiChatTurn[] => {
  const turns: AiChatTurn[] = [];
  let notes: string[] = [];
  for (const m of messages) {
    if (m.error) continue;
    if (m.role === "event") {
      notes.push(m.content);
      continue;
    }
    const content =
      m.role === "user" && notes.length > 0
        ? `(Nota del sistema: ${notes.join(" ")})\n${m.content}`
        : m.role === "assistant" && m.proposals?.length
          ? `${m.content}\n[Tarjetas que mostré: ${m.proposals.map((p, i) => `${p.title} — ${p.type === "report" ? "reporte" : CARD_STATUS[m.actions?.[i]?.status ?? "idle"]}`).join("; ")}]`
          : m.content;
    if (m.role === "user") notes = [];
    turns.push({ role: m.role, content, ...(m.attachments ? { attachments: m.attachments } : {}) });
  }
  const last = turns.slice(-20);
  return last.map((t, i) => (i === last.length - 1 ? t : { role: t.role, content: t.attachments?.length ? `${t.content}\n[Adjuntó: ${t.attachments.map((a) => a.name).join(", ")}]` : t.content }));
};

/**
 * Conversación con Tita, compartida por el panel rápido y la página /tita (vive en `useAiStore`, solo en memoria).
 * `send` pregunta (con adjuntos opcionales); `run` ejecuta una tarjeta confirmada y refresca todos los datos.
 */
export const useTitaConversation = () => {
  const messages = useAiStore((s) => s.messages);
  const pending = useAiStore((s) => s.pending);
  const reset = useAiStore((s) => s.reset);
  const queryClient = useQueryClient();

  const send = async (text: string, attachments: AiAttachment[] = []): Promise<string | null> => {
    const content = text.trim() || (attachments.length > 0 ? "Revise el archivo adjunto." : "");
    const store = useAiStore.getState();
    if (content === "" || store.pending) return null;
    store.push({ role: "user", content, ...(attachments.length > 0 ? { attachments } : {}) });
    store.setPending(true);
    try {
      const r = await aiService.chat(toTurns(useAiStore.getState().messages));
      useAiStore.getState().push({ role: "assistant", content: r.reply, sources: r.sources, proposals: r.proposals });
      return r.reply;
    } catch (err) {
      useAiStore.getState().push({ role: "assistant", content: toApiError(err).message, error: true });
      return null;
    } finally {
      useAiStore.getState().setPending(false);
    }
  };

  const run = async (messageId: number, index: number, action: AiAction) => {
    const store = useAiStore.getState();
    store.setAction(messageId, index, { status: "running" });
    try {
      const data = await executeAiAction(action.request);
      const note = outcome(data);
      useAiStore.getState().setAction(messageId, index, { status: "done", note });
      useAiStore.getState().push({ role: "event", content: `Confirmado: ${action.title} (${note}).` });
      await queryClient.invalidateQueries();
    } catch (err) {
      const message = err instanceof Error && err.message === "Acción no permitida" ? err.message : toApiError(err).message;
      useAiStore.getState().setAction(messageId, index, { status: "failed", note: message });
      useAiStore.getState().push({ role: "event", content: `No se pudo: ${action.title}. La API respondió: ${message}` });
    }
  };

  const dismiss = (messageId: number, index: number, action: AiAction) => {
    useAiStore.getState().setAction(messageId, index, { status: "dismissed" });
    useAiStore.getState().push({ role: "event", content: `Descartado por la persona: ${action.title}.` });
  };

  return { messages, pending, send, run, dismiss, reset };
};
