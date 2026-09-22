import { Badge } from "@/components/ui";

const tone = (method: string): "good" | "warn" | "bad" | "neutral" => {
  switch (method.toUpperCase()) {
    case "POST":
      return "good";
    case "PUT":
    case "PATCH":
      return "warn";
    case "DELETE":
      return "bad";
    default:
      return "neutral";
  }
};

/** Etiqueta del método HTTP auditado: alta en verde, cambio en ámbar, borrado en rojo. */
export const AuditMethodBadge = ({ method }: { method: string }) => <Badge tone={tone(method)}>{method.toUpperCase()}</Badge>;
