import { useSensitivity } from "@/hooks/financial";
import type { ScenarioSummary } from "@/types/api";
import { salesRange } from "./financeShared";

/** Sensibilidad del VPN al aumento de ventas en el rango del lienzo; la comparten el Panel, Datos y Escenarios (misma caché). */
export const useSalesSensitivity = (scenario: ScenarioSummary) => useSensitivity(scenario.id, "salesIncrease", salesRange(scenario.salesIncrease));
