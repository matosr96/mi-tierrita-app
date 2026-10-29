import type { PayFrequency, PayrollStatus } from "@/types/api";

/** Rótulos en español de los valores que devuelve la API (no calcula nada). */
export const FREQUENCY_LABELS: Record<PayFrequency, string> = { MONTHLY: "Mensual", BIWEEKLY: "Quincenal" };

export const STATUS_LABELS: Record<PayrollStatus, string> = { DRAFT: "Borrador", APPROVED: "Aprobado", PAID: "Pagado" };

export const STATUS_TONES: Record<PayrollStatus, "neutral" | "good" | "warn"> = { DRAFT: "warn", APPROVED: "neutral", PAID: "good" };

export const personName = (p: { firstName: string; lastName: string } | null): string => (p ? `${p.firstName} ${p.lastName}` : "—");
