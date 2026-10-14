/** Clasificación de los métodos HTTP auditados: alta (POST), cambio (PUT/PATCH) y baja (DELETE). */
export type MethodKind = "create" | "update" | "remove" | "other";

export const methodKind = (method: string): MethodKind => {
  switch (method.toUpperCase()) {
    case "POST":
      return "create";
    case "PUT":
    case "PATCH":
      return "update";
    case "DELETE":
      return "remove";
    default:
      return "other";
  }
};

/** Verbo en pasado para leer la línea como una frase: «ana creó /sales». */
export const METHOD_VERB: Record<MethodKind, string> = { create: "creó", update: "modificó", remove: "eliminó", other: "escribió en" };

export const METHOD_LEGEND: { kind: Exclude<MethodKind, "other">; method: string; label: string }[] = [
  { kind: "create", method: "POST", label: "alta" },
  { kind: "update", method: "PUT", label: "cambio" },
  { kind: "remove", method: "DELETE", label: "baja" },
];

/** Separa la ruta en segmentos para resaltar los identificadores numéricos. */
export const pathSegments = (resource: string): { text: string; id: boolean }[] =>
  resource
    .split("/")
    .filter(Boolean)
    .map((text) => ({ text, id: /^\d+$/.test(text) }));

/** «13 oct 2026, 3:45 p. m.» → fecha y hora por separado, con el mismo formato de `dateTime`. */
export const splitDateTime = (formatted: string): { day: string; time: string } => {
  const cut = formatted.lastIndexOf(", ");
  return cut === -1 ? { day: formatted, time: "" } : { day: formatted.slice(0, cut), time: formatted.slice(cut + 2) };
};
