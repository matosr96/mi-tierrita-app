import axios from "axios";

/** Códigos de dominio de la API traducidos a mensajes legibles (documento 07, sección 6). */
export const ERROR_MESSAGES: Record<string, string> = {
  "400": "Revise los datos del formulario.",
  "404": "El recurso no existe.",
  "500": "Ocurrió un error en el servidor. Intente de nuevo.",
  "601": "El producto no existe.",
  "602": "La categoría no existe.",
  "603": "El usuario no existe.",
  "604": "El cliente no existe.",
  "605": "El proveedor no existe.",
  "606": "La venta no existe.",
  "607": "El escenario no existe.",
  "608": "El mensaje de contacto no existe.",
  "610": "Usuario o contraseña incorrectos.",
  "611": "La sesión no es válida. Inicie sesión de nuevo.",
  "612": "El usuario está inactivo.",
  "613": "No tiene permiso para esta acción.",
  "620": "No hay stock suficiente.",
  "621": "La venta supera el cupo de crédito disponible.",
  "622": "La venta ya estaba anulada.",
  "623": "El abono es mayor que el saldo del cliente.",
  "625": "El producto está inactivo.",
  "626": "El cliente está inactivo.",
  "630": "Ya existe un registro con ese dato.",
  "631": "La categoría tiene productos asociados.",
  "640": "Demasiados intentos. Espere unos minutos.",
  "650": "Los supuestos del escenario no son válidos.",
  "660": "El asistente de IA no está configurado en el servidor.",
  "661": "El asistente de IA no respondió. Intente de nuevo en un momento.",
  "662": "La respuesta de Tita ya no está disponible. Pregunte de nuevo.",
  "663": "La conversación no existe o ya se borró.",
  "685": "El comentario no existe o ya se eliminó.",
  "686": "El comentario al que responde es de otro registro o ya se eliminó.",
  "687": "Solo quien escribió el comentario o la administración puede eliminarlo.",
  "688": "El registro que quiere comentar no existe.",
  "670": "La alarma no existe o ya se eliminó.",
  "671": "Esa alarma ya no tiene una próxima hora: revise la fecha y la hora.",
  "672": "Ya tiene el máximo de 50 alarmas. Elimine alguna para crear otra.",
  "673": "Los avisos en este dispositivo no están configurados en el servidor.",
  "674": "Este dispositivo no estaba registrado para avisos.",
  "690": "El documento o enlace no existe.",
  "691": "La persona no tiene foto de perfil.",
};

export type ApiError = { code: string; message: string; details?: unknown };

export const toApiError = (err: unknown): ApiError => {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string; details?: unknown } | undefined;
    const code = body?.message ?? (err.response ? String(err.response.status) : "network");
    const message = ERROR_MESSAGES[code] ?? (err.response ? `Error ${code}.` : "No hay conexión con el servidor.");
    return { code, message, details: body?.details };
  }
  return { code: "unknown", message: err instanceof Error ? err.message : "Error inesperado." };
};

/** Errores de validación (400): campo → mensaje, para mostrarlos junto a cada campo. */
export const fieldErrors = (err: ApiError): Record<string, string> => {
  if (err.code !== "400" || !Array.isArray(err.details)) return {};
  const out: Record<string, string> = {};
  for (const d of err.details as { path?: string; message?: string }[]) {
    if (d.path && d.message && out[d.path] === undefined) out[d.path] = d.message;
  }
  return out;
};

/**
 * Qué pasó con una petición, para explicarlo en palabras y decidir si tiene sentido reintentar sola (brief de octubre
 * de 2026, punto 2): `timeout` (tardó demasiado), `offline` (sin conexión: reintento automático) o `code` (la API
 * respondió con un código reportable: nunca se reintenta solo, y menos un error de permisos).
 */
export type ErrorKind = "timeout" | "offline" | "code";
export type ClassifiedError = ApiError & { kind: ErrorKind; retryable: boolean };

export const classifyError = (err: unknown): ClassifiedError => {
  const api = toApiError(err);
  if (axios.isAxiosError(err) && !err.response) {
    const timedOut = err.code === "ECONNABORTED" || err.code === "ETIMEDOUT" || /timeout/i.test(err.message);
    return timedOut
      ? { ...api, code: "timeout", kind: "timeout", retryable: false, message: "Tardó demasiado en responder. Puede intentarlo de nuevo." }
      : { ...api, code: "offline", kind: "offline", retryable: true, message: "Sin conexión con el servidor. Se reintenta al volver la red." };
  }
  return { ...api, kind: "code", retryable: false };
};
