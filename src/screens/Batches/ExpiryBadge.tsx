import { Badge } from "@/components/ui";
import { int } from "@/lib/format";
import type { ProductBatch } from "@/types/api";

type ExpiryInfo = Pick<ProductBatch, "expired" | "daysToExpire">;

/** Tono del vencimiento: vencido o a 7 días es crítico, a 30 días es advertencia. */
export const expiryTone = (b: ExpiryInfo): "bad" | "warn" | "neutral" => (b.expired || b.daysToExpire <= 7 ? "bad" : b.daysToExpire <= 30 ? "warn" : "neutral");

export const expiryText = (b: ExpiryInfo): string => {
  if (b.expired) return "Vencido";
  if (b.daysToExpire <= 0) return "Vence hoy";
  if (b.daysToExpire === 1) return "1 día";
  return `${int(b.daysToExpire)} días`;
};

/** Días para vencer de un lote, tal como los devuelve la API. */
export const ExpiryBadge = ({ batch }: { batch: ExpiryInfo }) => <Badge tone={expiryTone(batch)}>{expiryText(batch)}</Badge>;
