import { http } from "@/lib/http";
import type { AiActionRequest, AiBriefing, AiChatTurn, AiDraft, AiDraftRequest, AiInvoiceReading, AiReply, AiStatus } from "@/types/api";

/** El asistente consulta varias herramientas antes de responder: más tiempo que el resto de la API. */
const SLOW = { timeout: 90_000 };

export const aiService = {
  status: async (): Promise<AiStatus> => (await http.get<AiStatus>("/ai/status")).data,
  briefing: async (): Promise<AiBriefing> => (await http.get<AiBriefing>("/ai/briefing", SLOW)).data,
  chat: async (messages: AiChatTurn[]): Promise<AiReply> => (await http.post<AiReply>("/ai/chat", { messages }, SLOW)).data,
  draft: async (input: AiDraftRequest): Promise<AiDraft> => (await http.post<AiDraft>("/ai/drafts", input, SLOW)).data,
  readInvoice: async (image: string, mediaType: "image/jpeg"): Promise<AiInvoiceReading> => (await http.post<AiInvoiceReading>("/ai/invoice", { image, mediaType }, SLOW)).data,
};

/** Cabecera con la que la API marca en la auditoría una operación confirmada desde un borrador del asistente. */
export const aiSuggestedHeaders = (aiSuggested?: boolean) => (aiSuggested ? { headers: { "X-AI-Suggested": "1" } } : undefined);

/**
 * Rutas que una tarjeta de Tita puede ejecutar: las mismas escrituras de la app, nada más. La petición la arma el
 * servidor, pero se vuelve a comprobar aquí para que un texto del modelo nunca termine en una ruta distinta.
 */
const ALLOWED_ACTIONS: { method: AiActionRequest["method"]; path: RegExp }[] = [
  { method: "POST", path: /^\/customers$/ },
  { method: "PUT", path: /^\/customers\/\d+$/ },
  { method: "POST", path: /^\/customers\/\d+\/payments$/ },
  { method: "POST", path: /^\/sales$/ },
  { method: "POST", path: /^\/sales\/\d+\/void$/ },
  { method: "POST", path: /^\/products$/ },
  { method: "PUT", path: /^\/products\/\d+$/ },
  { method: "DELETE", path: /^\/products\/\d+$/ },
  { method: "POST", path: /^\/products\/\d+\/batches$/ },
  { method: "POST", path: /^\/categories$/ },
  { method: "POST", path: /^\/suppliers$/ },
  { method: "PUT", path: /^\/suppliers\/\d+$/ },
  { method: "POST", path: /^\/suppliers\/\d+\/purchases$/ },
  { method: "POST", path: /^\/financial\/scenarios$/ },
  { method: "PATCH", path: /^\/contact-messages\/\d+$/ },
  { method: "POST", path: /^\/chat\/messages$/ },
];

export const isAllowedAction = (r: AiActionRequest): boolean => ALLOWED_ACTIONS.some((a) => a.method === r.method && a.path.test(r.path));

/** Ejecuta una tarjeta confirmada contra la API real, marcada en la auditoría como sugerida por Tita. */
export const executeAiAction = async (r: AiActionRequest): Promise<unknown> => {
  if (!isAllowedAction(r)) throw new Error("Acción no permitida");
  const config = { headers: { "X-AI-Suggested": "1" } };
  const res =
    r.method === "DELETE"
      ? await http.delete(r.path, config)
      : r.method === "PUT"
        ? await http.put(r.path, r.body ?? {}, config)
        : r.method === "PATCH"
          ? await http.patch(r.path, r.body ?? {}, config)
          : await http.post(r.path, r.body ?? {}, config);
  return res.data;
};
