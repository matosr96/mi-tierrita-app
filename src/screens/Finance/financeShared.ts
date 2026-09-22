import type { Assumptions, ScenarioIndicators, SensitivityVariable } from "@/types/api";
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

export const SENSITIVITY_LABELS: Record<SensitivityVariable, string> = {
  salesIncrease: "Aumento de ventas",
  inventoryTurnover: "Rotación del inventario",
  tmar: "TMAR",
};

export const SENSITIVITY_OPTIONS: { value: SensitivityVariable; label: string }[] = [
  { value: "salesIncrease", label: SENSITIVITY_LABELS.salesIncrease },
  { value: "inventoryTurnover", label: SENSITIVITY_LABELS.inventoryTurnover },
  { value: "tmar", label: SENSITIVITY_LABELS.tmar },
];

export const formatSensitivityX = (variable: SensitivityVariable): ((v: number) => string) => (variable === "inventoryTurnover" ? times : pct);

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

export type ScenarioStatus = { label: "Recomendado" | "Viable" | "Descartado"; tone: "good" | "neutral" | "bad" };

/** Lectura del estado a partir de los indicadores que devuelve la API (no calcula nada). */
export const scenarioStatus = (ind: ScenarioIndicators): ScenarioStatus => {
  if (ind.npv > 0 && ind.coverageIncremental !== null && ind.coverageIncremental >= 1) return { label: "Recomendado", tone: "good" };
  if (ind.npv > 0) return { label: "Viable", tone: "neutral" };
  return { label: "Descartado", tone: "bad" };
};

/** Diferencia en puntos porcentuales entre dos fracciones, con dos decimales (solo texto). */
export const pointsBetween = (a: number, b: number): string => new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(a - b) * 100);
