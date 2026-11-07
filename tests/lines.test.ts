import { test } from "node:test";
import assert from "node:assert/strict";
import { LINES_FALLBACK } from "../src/screens/Landing/content";
import { resolveLines, splitLineName, toProductLine } from "../src/screens/Landing/lines";

/** Líneas de producto iguales en la página pública y en el inventario (6/11/2026). */

test("splitLineName reproduce los seis cortes tipográficos de la landing a partir del nombre de la base", () => {
  const expected: Record<string, [string, string]> = {
    "Alimentos balanceados": ["Alimentos", "balanceados"],
    "Medicina veterinaria": ["Medicina", "veterinaria"],
    "Semillas y fertilizantes": ["Semillas y", "fertilizantes"],
    "Aves de corral": ["Aves de", "corral"],
    "Productos agroquímicos": ["Productos", "agroquímicos"],
    "Ferretería agrícola": ["Ferretería", "agrícola"],
  };
  for (const [full, [name, accent]] of Object.entries(expected)) assert.deepEqual(splitLineName(full), { name, accent });
  assert.deepEqual(splitLineName("Lácteos"), { name: "Lácteos", accent: "" });
  assert.deepEqual(splitLineName("  Aves   de  corral "), { name: "Aves de", accent: "corral" });
  assert.deepEqual(splitLineName(""), { name: "", accent: "" });
});

test("la copia de respaldo tiene seis líneas con código 01…06 y coincide con lo que la API devolvería para esos nombres", () => {
  assert.deepEqual(
    LINES_FALLBACK.map((l) => l.code),
    ["01", "02", "03", "04", "05", "06"],
  );
  for (const l of LINES_FALLBACK) {
    const fromApi = toProductLine({ code: l.code, name: `${l.name} ${l.accent}`, description: l.text, tags: l.tags });
    assert.deepEqual(fromApi, l, l.code);
  }
});

test("resolveLines usa la API cuando ya respondió y el respaldo mientras no", () => {
  assert.equal(resolveLines(undefined), LINES_FALLBACK);
  const lines = resolveLines([{ code: "04", name: "Pollos", description: null, tags: [] }]);
  assert.deepEqual(lines, [{ code: "04", name: "Pollos", accent: "", text: "", tags: [] }]);
  assert.deepEqual(resolveLines([]), []);
});
