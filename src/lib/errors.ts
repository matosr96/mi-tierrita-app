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
