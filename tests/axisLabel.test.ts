import { test } from "node:test";
import assert from "node:assert/strict";
import { truncateLabel, wrapAxisLabel } from "../src/components/charts/axisLabel";

test("un rótulo que cabe queda en una línea", () => {
  assert.deepEqual(wrapAxisLabel("Aves de corral", 14), ["Aves de corral"]);
});

test("un rótulo largo se parte por palabras en dos líneas", () => {
  assert.deepEqual(wrapAxisLabel("Medicina veterinaria", 12), ["Medicina", "veterinaria"]);
  assert.deepEqual(wrapAxisLabel("Semillas y fertilizantes", 12), ["Semillas y", "fertilizant…"]);
});

test("una sola palabra más larga que el ancho se corta con puntos suspensivos", () => {
  assert.deepEqual(wrapAxisLabel("Agroquímicos", 8), ["Agroquí…"]);
});

test("las barras horizontales recortan el final, no el principio", () => {
  assert.equal(truncateLabel("Cebo para hormiga arriera 1 kg", 25), "Cebo para hormiga arrier…");
  assert.equal(truncateLabel("Leche entera 1L", 25), "Leche entera 1L");
});
