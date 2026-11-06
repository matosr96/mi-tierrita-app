import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPACT_AT, EXPAND_AT, shouldCompact } from "../src/components/layout/topbar";

const page = { scrollHeight: 2000, innerHeight: 800, delta: 42 };

test("la barra se compacta pasado el umbral y se expande solo al volver casi arriba (histéresis mayor que el delta)", () => {
  assert.equal(shouldCompact({ ...page, compact: false, scrollY: COMPACT_AT }), false);
  assert.equal(shouldCompact({ ...page, compact: false, scrollY: COMPACT_AT + 1 }), true);
  // Ya compacta: aunque el documento se acorte y scrollY baje hasta 65 − 42 = 23 px, sigue compacta.
  assert.equal(shouldCompact({ ...page, compact: true, scrollY: COMPACT_AT + 1 - page.delta }), true);
  assert.equal(shouldCompact({ ...page, compact: true, scrollY: EXPAND_AT }), true);
  assert.equal(shouldCompact({ ...page, compact: true, scrollY: EXPAND_AT - 1 }), false);
  assert.ok(COMPACT_AT - EXPAND_AT > page.delta, "el hueco de la histéresis supera el delta de la barra");
});

test("en una página corta la barra no se compacta: al encogerse ya no quedaría recorrido", () => {
  // Recorrido de 100 px; al encogerse la barra 42 px quedan 58 px, menos que el umbral: no se compacta.
  assert.equal(shouldCompact({ compact: false, scrollY: 90, scrollHeight: 900, innerHeight: 800, delta: 42 }), false);
  // Con recorrido de sobra sí.
  assert.equal(shouldCompact({ compact: false, scrollY: 90, scrollHeight: 1000, innerHeight: 800, delta: 42 }), true);
});
