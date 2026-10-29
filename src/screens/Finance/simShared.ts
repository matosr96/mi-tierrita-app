import type { SimulatorInput, SimulatorResult } from "@/types/api";

/** Vocabulario del simulador financiero. Nada de aquí calcula: solo nombra y ordena lo que devuelve la API. */

export type SimTab = "mercado" | "competencia" | "costos" | "inversion" | "financiacion" | "flujo" | "riesgos" | "escenarios";

/** Las siete secciones en cadena más Escenarios, en el mismo orden del informe. */
export const SIM_TABS: { value: SimTab; label: string; question: string }[] = [
  { value: "mercado", label: "Mercado", question: "¿Cuánta gente me va a comprar?" },
  { value: "competencia", label: "Competencia", question: "¿Cuánto de ese mercado me toca?" },
  { value: "costos", label: "Costos", question: "¿Cuánto me cuesta vender eso?" },
  { value: "inversion", label: "Inversión", question: "¿Cuánta plata necesito al inicio?" },
  { value: "financiacion", label: "Financiación", question: "¿De dónde sale la plata?" },
  { value: "flujo", label: "Flujo de caja", question: "¿Al final me deja ganancia?" },
  { value: "riesgos", label: "Riesgos e informe", question: "¿Y si me va peor?" },
  { value: "escenarios", label: "Escenarios", question: "Proyectos guardados, comparación y exportación" },
];

export const isSimTab = (v: string | undefined): v is SimTab => SIM_TABS.some((t) => t.value === v);

/** Lo que recibe cada pestaña: la entrada en edición, el cálculo de la API y cómo cambiar la entrada. */
export type TabProps = {
  input: SimulatorInput;
  result: SimulatorResult;
  onChange: (next: SimulatorInput) => void;
  /** Errores de validación de la API por ruta (`input.market.population`). */
  errors: Record<string, string>;
};

/** Copia de la entrada con una sección cambiada (nunca muta la original). */
export const patchSection = <S extends keyof SimulatorInput>(input: SimulatorInput, section: S, patch: Partial<SimulatorInput[S]>): SimulatorInput => ({
  ...input,
  [section]: { ...input[section], ...patch },
});

export const errorAt = (errors: Record<string, string>, path: string): string | undefined => errors[`input.${path}`];

/** Nombre de archivo sin tildes ni espacios. */
export const fileBase = (name: string): string =>
  `simulador_${name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 48)}`;

const pointsFormat = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** −0,002 → «−0,2 puntos» (variación del desempleo o cambio de una tasa). */
export const points = (fraction: number): string => `${fraction < 0 ? "−" : ""}${pointsFormat.format(Math.abs(fraction * 100))} puntos`;

/** Número con signo tipográfico para mostrar una fórmula: −1,2. */
export const signed = (value: number, digits = 2): string =>
  `${value < 0 ? "−" : ""}${new Intl.NumberFormat("es-CO", { maximumFractionDigits: digits }).format(Math.abs(value))}`;
