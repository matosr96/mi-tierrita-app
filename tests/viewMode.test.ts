import { test } from "node:test";
import assert from "node:assert/strict";
import { readViewMode, writeViewMode, viewModeKey, type ViewMode } from "../src/components/ui/viewMode";

const memory = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
};
const ALL: ViewMode[] = ["cards", "list", "table"];

test("la clave de la vista es mi-tierrita:<key>-vista", () => {
  assert.equal(viewModeKey("inventario"), "mi-tierrita:inventario-vista");
});

test("readViewMode devuelve el valor guardado si es válido", () => {
  const s = memory({ "mi-tierrita:clientes-vista": "cards" });
  assert.equal(readViewMode(s, "clientes", ALL, "list"), "cards");
});

test("readViewMode ignora valores desconocidos o no permitidos para la pantalla", () => {
  assert.equal(readViewMode(memory({ "mi-tierrita:clientes-vista": "kanban" }), "clientes", ALL, "list"), "list");
  assert.equal(readViewMode(memory({ "mi-tierrita:x-vista": "list" }), "x", ["cards", "table"], "table"), "table");
});

test("readViewMode usa el valor por defecto si no hay nada guardado", () => {
  assert.equal(readViewMode(memory(), "proveedores", ALL, "table"), "table");
  assert.equal(readViewMode(null, "proveedores", ALL, "table"), "table");
});

test("los valores antiguos de Inventario siguen valiendo: mosaic es cards y table sigue siendo table", () => {
  assert.equal(readViewMode(memory({ "mi-tierrita:inventario-vista": "mosaic" }), "inventario", ALL, "table"), "cards");
  assert.equal(readViewMode(memory({ "mi-tierrita:inventario-vista": "table" }), "inventario", ALL, "cards"), "table");
});

test("un almacenamiento que lanza no rompe la lectura ni la escritura", () => {
  const broken = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.equal(readViewMode(broken, "inventario", ALL, "table"), "table");
  assert.doesNotThrow(() => writeViewMode(broken, "inventario", "list"));
});

test("writeViewMode guarda con la clave de la pantalla", () => {
  const s = memory();
  writeViewMode(s, "clientes", "table");
  assert.equal(s.data.get("mi-tierrita:clientes-vista"), "table");
});
