import type { Assumptions, Range, ScenarioSummary } from "@/types/api";
import { int, money, pct, times } from "@/lib/format";

/** Vocabulario y ayudas de presentación del módulo de finanzas (capítulo 5 del TCC). */

export type ValueKind = "money" | "pct" | "int" | "months" | "years" | "times";

export type AssumptionField = { key: keyof Assumptions; label: string; kind: ValueKind; group: AssumptionGroup; hint?: string };

export type AssumptionGroup = "Operación actual" | "Inversión y efecto esperado" | "Financiación" | "Parámetros de evaluación";

export const ASSUMPTION_GROUPS: AssumptionGroup[] = ["Operación actual", "Inversión y efecto esperado", "Financiación", "Parámetros de evaluación"];

/** Los 17 supuestos base, en el orden y con los nombres de la vista "Datos y supuestos". */
export const ASSUMPTION_FIELDS: AssumptionField[] = [
  { key: "monthlySales", label: "Ventas promedio mensuales", kind: "money", group: "Operación actual", hint: "COP por mes" },
  { key: "costOfSalesPct", label: "Costo de ventas", kind: "pct", group: "Operación actual", hint: "% de las ventas" },
  { key: "fixedExpensesMonth", label: "Gastos fijos mensuales", kind: "money", group: "Operación actual" },
  { key: "ownerWithdrawalsMonth", label: "Retiros del propietario al mes", kind: "money", group: "Operación actual" },
  { key: "baseSalesGrowth", label: "Crecimiento base de ventas", kind: "pct", group: "Operación actual", hint: "% anual sin ampliación" },
  { key: "constructionInvestment", label: "Obra civil y remodelación", kind: "money", group: "Inversión y efecto esperado" },
  { key: "equipmentInvestment", label: "Estantería y equipos", kind: "money", group: "Inversión y efecto esperado" },
  { key: "salesIncreasePct", label: "Aumento esperado de ventas", kind: "pct", group: "Inversión y efecto esperado", hint: "Supuesto crítico" },
  { key: "additionalFixedExpensesMonth", label: "Gastos fijos adicionales", kind: "money", group: "Inversión y efecto esperado", hint: "COP por mes" },
  { key: "inventoryTurnover", label: "Rotación del inventario", kind: "times", group: "Inversión y efecto esperado", hint: "veces al año" },
  { key: "creditRateEA", label: "Tasa de interés del crédito", kind: "pct", group: "Financiación", hint: "% EA" },
  { key: "termMonths", label: "Plazo del crédito", kind: "months", group: "Financiación" },
  { key: "investorRateEA", label: "Tasa del inversionista", kind: "pct", group: "Financiación", hint: "% EA" },
  { key: "tmarEA", label: "TMAR", kind: "pct", group: "Parámetros de evaluación", hint: "% EA exigido" },
  { key: "horizonYears", label: "Horizonte de evaluación", kind: "years", group: "Parámetros de evaluación" },
  { key: "inflation", label: "Inflación anual", kind: "pct", group: "Parámetros de evaluación" },
  { key: "salvageValuePct", label: "Valor de salvamento", kind: "pct", group: "Parámetros de evaluación", hint: "% de la inversión fija" },
];

export const formatValue = (kind: ValueKind, value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  switch (kind) {
    case "money":
      return money(value);
    case "pct":
      return pct(value);
    case "int":
      return int(value);
    case "months":
      return `${int(value)} meses`;
    case "years":
      return `${int(value)} años`;
    case "times":
      return times(value);
  }
};

/** Etiquetas en español de las variables del tornado (Tabla 11). */
export const TORNADO_LABELS: Record<string, string> = {
  grossMargin: "Margen bruto",
  salesIncrease: "Aumento de ventas",
  fixedInvestment: "Inversión fija",
  tmar: "TMAR",
  additionalExpensesMonth: "Gastos fijos adicionales",
  inventoryTurnover: "Rotación del inventario",
  salvageValuePct: "Valor de salvamento",
  creditRateEA: "Tasa del crédito",
};

/**
 * Única derivación permitida en el cliente: el valor de la variable donde el VPN cruza cero,
 * por interpolación lineal entre los dos puntos vecinos que devuelve la API. Se rotula "aprox.".
 */
export const breakEven = (points: { value: number; npv: number }[]): number | null => {
  const sorted = [...points].sort((a, b) => a.value - b.value);
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (!a) continue;
    if (a.npv === 0) return a.value;
    if (!b) continue;
    if ((a.npv < 0 && b.npv > 0) || (a.npv > 0 && b.npv < 0)) {
      return a.value + ((0 - a.npv) * (b.value - a.value)) / (b.npv - a.npv);
    }
  }
  return null;
};

const round2 = (v: number): number => Math.round(v * 100) / 100;

/** Rango del lienzo (10 % a 32 %, paso 1 %) ampliado si el caso base queda por fuera. */
export const salesRange = (base: number): Range => ({
  from: Math.min(0.1, Math.max(0.01, round2(base - 0.1))),
  to: Math.max(0.32, round2(base + 0.12)),
  step: 0.01,
});

/** Diferencia en puntos porcentuales entre el caso base y el equilibrio (solo texto). */
export const marginPoints = (current: number, be: number): number => (current - be) * 100;

const pointsFormat = (decimals: number) => new Intl.NumberFormat("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** "1,84" o "1,8": valor absoluto en puntos porcentuales con los decimales pedidos. */
export const formatPoints = (points: number, decimals = 2): string => pointsFormat(decimals).format(Math.abs(points));

/** Diferencia en puntos porcentuales entre dos fracciones, con dos decimales (solo texto). */
export const pointsBetween = (a: number, b: number): string => formatPoints((a - b) * 100, 2);

/** "+$ 585.259", "−$ 19.500.000" o "$ 0": diferencia con signo tipográfico. */
export const signedText = (value: number, format: (v: number) => string): string => (value < 0 ? `−${format(Math.abs(value))}` : value > 0 ? `+${format(value)}` : format(0));

/** Letra de columna del lienzo (A, B, C…). */
export const letterOf = (index: number): string => String.fromCharCode(65 + index);

export type ScenarioStatus = { label: "Recomendado" | "Viable" | "Evaluar" | "Descartado"; tone: "good" | "neutral" | "warn" | "bad" };

/**
 * Lectura del estado de cada escenario a partir de los indicadores que devuelve la API (no calcula nada):
 * VPN ≤ 0 → Descartado; VPN > 0 sin cubrir la cuota → Evaluar; VPN > 0 y cobertura ≥ 1 → Viable;
 * entre los viables, el de mayor VPN del inversionista → Recomendado.
 */
export const scenarioStatuses = (list: ScenarioSummary[]): Map<number, ScenarioStatus> => {
  const map = new Map<number, ScenarioStatus>();
  let best: ScenarioSummary | null = null;
  for (const s of list) {
    const { npv, coverageIncremental: cov } = s.indicators;
    if (npv <= 0) map.set(s.id, { label: "Descartado", tone: "bad" });
    else if (cov === null || cov < 1) map.set(s.id, { label: "Evaluar", tone: "warn" });
    else {
      map.set(s.id, { label: "Viable", tone: "neutral" });
      if (!best || s.indicators.investorNpv > best.indicators.investorNpv) best = s;
    }
  }
  if (best) map.set((best as ScenarioSummary).id, { label: "Recomendado", tone: "good" });
  return map;
};

/** Igualdad tolerante para ubicar el caso base dentro de una rejilla de la API. */
export const sameValue = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
