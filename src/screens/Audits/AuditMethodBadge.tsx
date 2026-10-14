import { Badge } from "@/components/ui";
import { methodKind } from "./auditMethod";

const TONE = { create: "good", update: "warn", remove: "bad", other: "neutral" } as const;

/** Etiqueta del método HTTP auditado: alta en verde, cambio en ámbar, borrado en rojo. */
export const AuditMethodBadge = ({ method }: { method: string }) => <Badge tone={TONE[methodKind(method)]}>{method.toUpperCase()}</Badge>;
