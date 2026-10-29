import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { keys } from "@/hooks/shared";
import { aiService, executeAiAction, screenOf } from "@/services/ai";
import { classifyError, toApiError } from "@/lib/errors";
import { useAiStore, type AiMessage } from "@/stores/ai";
import type { AiAction, AiAttachment, AiChatTurn, AiReply } from "@/types/api";

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
    const named = m.attachmentNames?.length ? `${content}\n[Adjuntó: ${m.attachmentNames.join(", ")}]` : content;
    turns.push({ role: m.role, content: named, ...(m.attachments ? { attachments: m.attachments } : {}) });
  }
  const last = turns.slice(-20);
  return last.map((t, i) => (i === last.length - 1 ? t : { role: t.role, content: t.attachments?.length ? `${t.content}\n[Adjuntó: ${t.attachments.map((a) => a.name).join(", ")}]` : t.content }));
};

/** Respuesta en dos pasos (brief de octubre de 2026, punto 1): consulta cada 1,5 s; se rinde pasados 3 minutos. */
export const POLL_MS = 1_500;
export const POLL_DEADLINE_MS = 180_000;
/** Caída de red al enviar la pregunta: hasta 3 reintentos espaciados; nunca ante un error con código. */
const SEND_RETRIES = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const waitOnline = async (ms: number) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await new Promise<void>((resolve) => {
      const done = () => {
        window.removeEventListener("online", done);
        resolve();
      };
      window.addEventListener("online", done);
      setTimeout(done, ms);
    });
  } else await sleep(ms);
};

/**
 * Envía la pregunta y espera la respuesta en dos pasos. Los cortes de red mientras se consulta no son un error: Tita
 * sigue trabajando en el servidor y la consulta se repite. Solo se rinde si la API responde con un código o si pasa
 * el plazo máximo (entonces es «tardó demasiado»).
 */
const askInTwoSteps = async (messages: AiChatTurn[], conversationId: number | null, screen: ReturnType<typeof screenOf>, setNote: (n: string | null) => void): Promise<AiReply> => {
  const request = { messages, ...(conversationId !== null ? { conversationId } : {}), ...(screen ? { screen } : {}) };
  let accepted: Awaited<ReturnType<typeof aiService.ask>> | null = null;
  for (let attempt = 0; accepted === null; attempt++) {
    try {
      accepted = await aiService.ask(request);
    } catch (err) {
      const e = classifyError(err);
      if (!e.retryable || attempt >= SEND_RETRIES) throw err;
      setNote("Sin conexión. Reintentando el envío…");
      await waitOnline(2_000 * (attempt + 1));
    }
  }
  setNote("Tita está revisando los datos…");
  const start = Date.now();
  for (;;) {
    await sleep(POLL_MS);
    if (Date.now() - start > POLL_DEADLINE_MS) {
      const timeout = Object.assign(new Error("timeout"), { isAxiosError: true, code: "ECONNABORTED", toJSON: () => ({}) });
      throw timeout;
    }
    try {
      const r = await aiService.task(accepted.tareaId);
      if ("status" in r && r.status === "pending") continue;
      return r as AiReply;
    } catch (err) {
      const e = classifyError(err);
      if (e.kind === "code") throw err;
      // Sin red o un timeout de la consulta: Tita sigue en el servidor, se vuelve a preguntar.
      setNote(e.kind === "offline" ? "Sin conexión. Esperando la red para recoger la respuesta…" : "Tita está revisando los datos…");
    }
  }
};

/**
 * Conversación con Tita, compartida por el panel rápido y la página /tita (vive en `useAiStore`; el servidor guarda el
 * historial). `send` pregunta (con adjuntos opcionales); `run` ejecuta una tarjeta confirmada y refresca todos los datos.
 */
export const useTitaConversation = () => {
  const messages = useAiStore((s) => s.messages);
  const pending = useAiStore((s) => s.pending);
  const pendingNote = useAiStore((s) => s.pendingNote);
  const conversationId = useAiStore((s) => s.conversationId);
  const reset = useAiStore((s) => s.reset);
  const queryClient = useQueryClient();
  const location = useLocation();

  const persistEvent = (content: string, card?: { messageId: number; index: number; status: "done" | "failed" | "dismissed"; note?: string }) => {
    const id = useAiStore.getState().conversationId;
    if (id === null) return;
    const serverId = card ? useAiStore.getState().messages.find((m) => m.id === card.messageId)?.serverId : undefined;
    void aiService
      .addEvent(id, { content, ...(card && serverId !== undefined ? { messageId: serverId, index: card.index, status: card.status, ...(card.note ? { note: card.note } : {}) } : {}) })
      .then(() => queryClient.invalidateQueries({ queryKey: [...keys.ai, "conversations"] }))
      .catch(() => undefined);
  };

  const send = async (text: string, attachments: AiAttachment[] = []): Promise<string | null> => {
    const content = text.trim() || (attachments.length > 0 ? "Revise el archivo adjunto." : "");
    const store = useAiStore.getState();
    if (content === "" || store.pending) return null;
    const userId = store.push({ role: "user", content, ...(attachments.length > 0 ? { attachments } : {}) });
    store.setPending(true, "Tita está revisando los datos…");
    const setNote = (note: string | null) => useAiStore.getState().setPending(true, note);
    try {
      const r = await askInTwoSteps(toTurns(useAiStore.getState().messages), useAiStore.getState().conversationId, screenOf(location.pathname), setNote);
      const s = useAiStore.getState();
      s.patch(userId, { serverId: r.userMessageId });
      s.setConversationId(r.conversationId);
      s.push({ role: "assistant", serverId: r.messageId, content: r.reply, sources: r.sources, proposals: r.proposals });
      void queryClient.invalidateQueries({ queryKey: [...keys.ai, "conversations"] });
      return r.reply;
    } catch (err) {
      const e = classifyError(err);
      const message =
        e.kind === "code"
          ? e.code === "613"
            ? "Su cuenta no tiene permiso para esta consulta. Si cree que es un error, repórtelo con el código 613."
            : `${e.message} Si se repite, reporte el código ${e.code}.`
          : e.kind === "timeout"
            ? "Tardó demasiado: Tita no alcanzó a responder a tiempo. Puede intentarlo de nuevo; si ya terminó, la respuesta aparece en el historial."
            : "Sin conexión con el servidor. Revise la red e intente de nuevo.";
      useAiStore.getState().push({ role: "assistant", content: message, error: true, errorKind: e.kind, errorCode: e.code, retryOf: { content, attachments } });
      return null;
    } finally {
      useAiStore.getState().setPending(false);
    }
  };

  /** Vuelve a enviar la pregunta de una burbuja de error (la quita y repite la pregunta tal cual). */
  const retry = async (errorMessageId: number) => {
    const m = useAiStore.getState().messages.find((x) => x.id === errorMessageId);
    if (!m?.retryOf) return;
    const s = useAiStore.getState();
    s.remove(errorMessageId);
    // La pregunta ya quedó en pantalla (y en el historial): se reenvía sin duplicarla.
    const lastUser = [...s.messages].reverse().find((x) => x.role === "user");
    if (lastUser) s.remove(lastUser.id);
    await send(m.retryOf.content, m.retryOf.attachments);
  };

  const run = async (messageId: number, index: number, action: AiAction) => {
    const store = useAiStore.getState();
    store.setAction(messageId, index, { status: "running" });
    try {
      const data = await executeAiAction(action.request);
      const note = outcome(data);
      useAiStore.getState().setAction(messageId, index, { status: "done", note });
      const text = `Confirmado: ${action.title} (${note}).`;
      useAiStore.getState().push({ role: "event", content: text });
      persistEvent(text, { messageId, index, status: "done", note });
      await queryClient.invalidateQueries();
    } catch (err) {
      const message = err instanceof Error && err.message === "Acción no permitida" ? err.message : toApiError(err).message;
      useAiStore.getState().setAction(messageId, index, { status: "failed", note: message });
      const text = `No se pudo: ${action.title}. La API respondió: ${message}`;
      useAiStore.getState().push({ role: "event", content: text });
      persistEvent(text, { messageId, index, status: "failed", note: message });
    }
  };

  const dismiss = (messageId: number, index: number, action: AiAction) => {
    useAiStore.getState().setAction(messageId, index, { status: "dismissed" });
    const text = `Descartado por la persona: ${action.title}.`;
    useAiStore.getState().push({ role: "event", content: text });
    persistEvent(text, { messageId, index, status: "dismissed" });
  };

  return { messages, pending, pendingNote, conversationId, send, retry, run, dismiss, reset };
};
