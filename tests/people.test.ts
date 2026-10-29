import { test } from "node:test";
import assert from "node:assert/strict";
import { presenceText } from "../src/components/people/presence";

test("ficha de persona: «Activo ahora» o «Últ. vez hace…» como en el chat", () => {
  const now = Date.parse("2026-10-29T15:00:00.000Z");
  assert.equal(presenceText(true, null, now), "Activo ahora");
  assert.equal(presenceText(false, null, now), "Sin conexión reciente");
  assert.equal(presenceText(false, "2026-10-29T14:59:40.000Z", now), "Últ. vez hace un momento");
  assert.equal(presenceText(false, "2026-10-29T14:35:00.000Z", now), "Últ. vez hace 25 min");
  assert.equal(presenceText(false, "2026-10-29T13:00:00.000Z", now), "Últ. vez hace 2 h");
  assert.equal(presenceText(false, "2026-10-28T12:00:00.000Z", now), "Últ. vez hace 1 día");
  assert.equal(presenceText(false, "2026-10-20T12:00:00.000Z", now), "Últ. vez hace 9 días");
});
