import type { SimulatorInput, SimulatorResult } from "@/types/api";

/** Vocabulario del simulador financiero. Nada de aquí calcula: solo nombra y ordena lo que devuelve la API. */

export type SimTab = "mercado" | "competencia" | "costos" | "inversion" | "financiacion" | "flujo" | "riesgos" | "escenarios";

/**
 * Las siete secciones en cadena más Escenarios, en el mismo orden del informe. `question` es la frase del brief (sección 3);
 * `from` y `feeds` dicen de dónde vienen las cifras de la pestaña y a cuál alimentan (lo que sale de una entra en la siguiente).
 */
export const SIM_TABS: { value: SimTab; label: string; question: string; from: string; feeds: string }[] = [
  { value: "mercado", label: "Mercado", question: "¿Cuánta gente me va a comprar?", from: "supuestos de población y consumo (fuente DANE o gremio, pendiente)", feeds: "Competencia (demanda mensual)" },
  { value: "competencia", label: "Competencia", question: "¿Cuánto de ese mercado me toca?", from: "Mercado (demanda mensual)", feeds: "Costos y Flujo de caja (unidades vendidas)" },
  { value: "costos", label: "Costos", question: "¿Cuánto me cuesta vender eso?", from: "Competencia (unidades vendidas)", feeds: "Flujo de caja (costos y precio de venta)" },
  { value: "inversion", label: "Inversión", question: "¿Cuánta plata necesito al inicio?", from: "supuestos de la inversión", feeds: "Financiación (monto) y Flujo de caja (año 0, depreciación y salvamento)" },
  { value: "financiacion", label: "Financiación", question: "¿De dónde sale la plata?", from: "Inversión (total)", feeds: "Cobertura de la cuota (aquí mismo); no cambia el VPN (decisión 4)" },
  { value: "flujo", label: "Flujo de caja", question: "¿Al final me deja ganancia?", from: "Competencia, Costos e Inversión", feeds: "Riesgos (VPN base)" },
  { value: "riesgos", label: "Riesgos e informe", question: "¿Y si me va peor?", from: "Flujo de caja (VPN base)", feeds: "Informe del proyecto (Reportes) y Escenarios" },
  { value: "escenarios", label: "Escenarios", question: "Proyectos guardados, comparación y exportación", from: "todas las pestañas (los supuestos guardados)", feeds: "Informe del proyecto (Reportes)" },
];

export const isSimTab = (v: string | undefined): v is SimTab => SIM_TABS.some((t) => t.value === v);

/** El escenario de ejemplo de la API ($94,5 M): valor de `?proyecto=` cuando no hay proyecto guardado. */
export const EXAMPLE_PROJECT = "ejemplo";
export const EXAMPLE_PROJECT_NAME = "Ampliación del local (ejemplo)";

/** Reportes → Informe del proyecto con el escenario preseleccionado (el atajo «Exportar escenario» solo navega aquí). */
export const projectReportPath = (projectId: number | null): string => `/reportes?r=proyecto&proyecto=${projectId ?? EXAMPLE_PROJECT}`;

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

/** ¿Alguna de estas rutas (o sus hijas, como `costs.fixedCosts[2].annual`) trae error? Sirve para abrir «Avanzado» solo. */
export const anyErrorAt = (errors: Record<string, string>, paths: string[]): boolean =>
  Object.keys(errors).some((k) => paths.some((p) => k === `input.${p}` || k.startsWith(`input.${p}.`) || k.startsWith(`input.${p}[`)));

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
