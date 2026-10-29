import { http } from "@/lib/http";
import type {
  AiActionRequest,
  AiBriefing,
  AiChatRequest,
  AiConversation,
  AiConversationDetail,
  AiConversationEventInput,
  AiDraft,
  AiDraftRequest,
  AiInvoiceReading,
  AiReply,
  AiStatus,
  AiTaskAccepted,
  AiTaskPending,
  Page,
  PageQuery,
} from "@/types/api";

/** El asistente consulta varias herramientas antes de responder: más tiempo que el resto de la API. */
const SLOW = { timeout: 90_000 };

export const aiService = {
  status: async (): Promise<AiStatus> => (await http.get<AiStatus>("/ai/status")).data,
  briefing: async (): Promise<AiBriefing> => (await http.get<AiBriefing>("/ai/briefing", SLOW)).data,
  /** Pregunta en un solo paso (espera la respuesta completa). */
  chat: async (input: AiChatRequest): Promise<AiReply> => (await http.post<AiReply>("/ai/chat", { ...input, asincrono: false }, SLOW)).data,
  /** Primer paso de la respuesta en dos pasos: la API acepta la pregunta (202) y devuelve la tarea que hay que consultar. */
  ask: async (input: AiChatRequest): Promise<AiTaskAccepted> => (await http.post<AiTaskAccepted>("/ai/chat", { ...input, asincrono: true })).data,
  /** Segundo paso: 202 mientras Tita trabaja, 200 con la respuesta cuando está lista. */
  task: async (tareaId: string): Promise<AiReply | AiTaskPending> => (await http.get<AiReply | AiTaskPending>(`/ai/mensajes/${encodeURIComponent(tareaId)}`)).data,
  conversations: async (query: PageQuery = {}): Promise<Page<AiConversation>> => (await http.get<Page<AiConversation>>("/ai/conversations", { params: query })).data,
  conversation: async (id: number): Promise<AiConversationDetail> => (await http.get<AiConversationDetail>(`/ai/conversations/${id}`)).data,
  deleteConversation: async (id: number): Promise<void> => {
    await http.delete(`/ai/conversations/${id}`);
  },
  addEvent: async (conversationId: number, input: AiConversationEventInput): Promise<{ id: number }> => (await http.post<{ id: number }>(`/ai/conversations/${conversationId}/events`, input)).data,
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
  { method: "POST", path: /^\/alarms$/ },
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

/** Pantalla actual como contexto para Tita, a partir de la ruta (sin parámetros). */
export const screenOf = (pathname: string): AiChatRequest["screen"] | undefined => {
  const first = pathname.split("/")[1] ?? "";
  const map: Record<string, NonNullable<AiChatRequest["screen"]>> = {
    "": "inicio",
    inventario: "inventario",
    lotes: "lotes",
    ventas: "ventas",
    clientes: "clientes",
    proveedores: "proveedores",
    finanzas: "finanzas",
    reportes: "reportes",
    tita: "tita",
    chat: "chat",
    contactos: "contactos",
    usuarios: "usuarios",
    auditoria: "auditoria",
    alarmas: "alarmas",
    perfil: "perfil",
    pedidos: "pedidos",
    nomina: "nomina",
    conteos: "conteos",
    calendario: "calendario",
    biblioteca: "biblioteca",
  };
  return map[first];
};
