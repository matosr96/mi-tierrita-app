import { test } from "node:test";
import assert from "node:assert/strict";
import { THEME_KEY, readTheme, writeTheme } from "../src/lib/theme";

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

test("apariencia: claro por defecto, guarda oscuro y del dispositivo, tolera almacenamiento bloqueado", () => {
  const s = memory();
  assert.equal(readTheme(s), "light");
  writeTheme(s, "dark");
  assert.equal(s.getItem(THEME_KEY), "dark");
  assert.equal(readTheme(s), "dark");
  writeTheme(s, "system");
  assert.equal(readTheme(s), "system");
  s.setItem(THEME_KEY, "rosado");
  assert.equal(readTheme(s), "light");
  const broken = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
  assert.equal(readTheme(broken), "light");
  assert.doesNotThrow(() => writeTheme(broken, "dark"));
  assert.equal(readTheme(null), "light");
});
