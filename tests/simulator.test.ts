import { test } from "node:test";
import assert from "node:assert/strict";
import { SIM_TABS, fileBase, isSimTab, patchSection, points, signed } from "../src/screens/Finance/simShared";
import { ratesNote } from "../src/screens/Finance/ratesNote";
import type { SimulatorInput, SimulatorResult } from "../src/types/api";

test("las pestañas del simulador siguen el orden del brief y del informe", () => {
  assert.deepEqual(
    SIM_TABS.map((t) => t.label),
    ["Mercado", "Competencia", "Costos", "Inversión", "Financiación", "Flujo de caja", "Riesgos e informe", "Escenarios"],
  );
  assert.equal(isSimTab("financiacion"), true);
  assert.equal(isSimTab("panel"), false);
});

test("patchSection cambia una sección sin mutar la entrada", () => {
  const input = { financing: { creditPct: 1, creditRateEA: 0.21, termMonths: 48 } } as unknown as SimulatorInput;
  const next = patchSection(input, "financing", { creditPct: 0.7 });
  assert.equal(next.financing.creditPct, 0.7);
  assert.equal(next.financing.termMonths, 48);
  assert.equal(input.financing.creditPct, 1);
});

test("formatos de presentación: puntos, signo y nombre de archivo", () => {
  assert.equal(points(-0.002).replace(/\s/g, " "), "−0,2 puntos");
  assert.equal(signed(-1.2), "−1,2");
  assert.equal(fileBase("Ampliación del local · 70 %"), "simulador_ampliacion-del-local-70");
});

test("ratesNote arma el párrafo de la decisión 4 solo con cifras de la API", () => {
  const result = {
    indicators: { discountRate: 0.18, taxRate: 0.35, irr: 0.2523, irrOverCredit: 0.0423 },
    financing: { creditRateEA: 0.21, afterTaxCostOfDebt: 0.1365 },
  } as unknown as SimulatorResult;
  const text = ratesNote(result).join(" ").replace(/\s/g, " ");
  assert.match(text, /13,65\s?%/);
  assert.match(text, /por 4,23 puntos/);
  assert.match(text, /escudo fiscal/);
  assert.match(text, /prima por el riesgo/);
  assert.match(text, /margen es estrecho/);
  const below = ratesNote({ ...result, indicators: { ...result.indicators, irr: 0.19, irrOverCredit: -0.02 } } as SimulatorResult).join(" ");
  assert.match(below, /no alcanza a pagar sus propios intereses/);
});
