import { test } from "node:test";
import assert from "node:assert/strict";
import { suggestionsFor } from "../src/components/ai/suggestions";

test("las sugerencias de Tita cambian con la pantalla y respetan el rol", () => {
  const inv = suggestionsFor("WAREHOUSE", "inventario");
  assert.equal(inv.title, "Sobre Inventario");
  assert.ok(inv.items.some((s) => /stock bajo/.test(s)));
  // Bodega no tiene herramientas de clientes: en Clientes recibe las sugerencias de su rol, no las de cartera.
  const cli = suggestionsFor("WAREHOUSE", "clientes");
  assert.equal(cli.title, null);
  assert.ok(!cli.items.some((s) => /cobrar/i.test(s)));
  assert.equal(suggestionsFor("ADMIN", undefined).title, null);
  assert.equal(suggestionsFor("ADMIN", "tita").title, null);
});
