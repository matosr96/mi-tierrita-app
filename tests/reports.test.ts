import { test } from "node:test";
import assert from "node:assert/strict";
import { amortizationRows, depreciationRows } from "../src/screens/Reports/projectReport";
import { EXAMPLE_PROJECT, SIM_TABS, anyErrorAt, projectReportPath } from "../src/screens/Finance/simShared";
import type { SimDepreciationYear } from "../src/types/api";

const schedule: SimDepreciationYear[] = [
  { year: 1, depreciation: 6_200_000, amortization: 1_300_000, charge: 7_500_000, netBookValue: 55_800_000, deferredNetValue: 5_200_000 },
  { year: 2, depreciation: 6_200_000, amortization: 1_300_000, charge: 7_500_000, netBookValue: 49_600_000, deferredNetValue: 3_900_000 },
];

test("las tablas de depreciación y de amortización se arman por separado desde la misma tabla de la API", () => {
  const dep = depreciationRows(schedule);
  const amo = amortizationRows(schedule);
  assert.equal(dep.length, 2);
  assert.equal(dep[0]?.length, 3, "año, depreciación y valor neto de los activos");
  assert.match(dep[0]?.[1] ?? "", /6\.200\.000/);
  assert.match(dep[1]?.[2] ?? "", /49\.600\.000/);
  assert.equal(amo[0]?.length, 3, "año, amortización y valor neto de los diferidos");
  assert.match(amo[0]?.[1] ?? "", /1\.300\.000/);
  assert.match(amo[1]?.[2] ?? "", /3\.900\.000/);
  // Ninguna de las dos mezcla la cifra de la otra.
  assert.doesNotMatch(dep.flat().join(" "), /1\.300\.000/);
  assert.doesNotMatch(amo.flat().join(" "), /6\.200\.000/);
});

test("«Exportar escenario» solo arma el enlace a Reportes → Informe con el escenario elegido", () => {
  assert.equal(projectReportPath(7), "/reportes?r=proyecto&proyecto=7");
  assert.equal(projectReportPath(null), `/reportes?r=proyecto&proyecto=${EXAMPLE_PROJECT}`);
});

test("cada pestaña dice qué pregunta responde, de dónde viene y a qué alimenta", () => {
  for (const t of SIM_TABS) {
    assert.ok(t.question.length > 0, t.value);
    assert.ok(t.from.length > 0, t.value);
    assert.ok(t.feeds.length > 0, t.value);
  }
  const questions = SIM_TABS.slice(0, 7).map((t) => t.question);
  assert.deepEqual(questions, ["¿Cuánta gente me va a comprar?", "¿Cuánto de ese mercado me toca?", "¿Cuánto me cuesta vender eso?", "¿Cuánta plata necesito al inicio?", "¿De dónde sale la plata?", "¿Al final me deja ganancia?", "¿Y si me va peor?"]);
});

test("anyErrorAt abre «Avanzado» cuando un campo escondido trae error, incluidas las listas", () => {
  const errors = { "input.costs.inflation": "Debe ser un porcentaje", "input.competition.competitors[1].share": "Máximo 100 %" };
  assert.equal(anyErrorAt(errors, ["costs.inflation"]), true);
  assert.equal(anyErrorAt(errors, ["competition.competitors"]), true);
  assert.equal(anyErrorAt(errors, ["market.gdpGrowth", "financing.creditRateEA"]), false);
});
