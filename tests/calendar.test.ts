import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByDay, monthGrid, monthRange, shiftMonth } from "../src/components/calendar/calendarGroups";
import type { CalendarItem } from "../src/types/api";

const item = (id: string, date: string): CalendarItem => ({ id, kind: "alarm", title: id, detail: "", date, priority: "media", area: "Alarmas", status: "pending", href: "/alarmas" });

test("groupByDay agrupa por fecha en orden y conserva el orden de la API dentro del día", () => {
  const groups = groupByDay([item("b", "2026-10-30"), item("a", "2026-10-29"), item("c", "2026-10-30"), item("d", "2026-11-02")]);
  assert.deepEqual(
    groups.map((g) => [g.date, g.items.map((i) => i.id)]),
    [
      ["2026-10-29", ["a"]],
      ["2026-10-30", ["b", "c"]],
      ["2026-11-02", ["d"]],
    ],
  );
  assert.deepEqual(groupByDay([]), []);
});

test("monthGrid: octubre de 2026 empieza en jueves, así que la primera semana arranca el lunes 28/09", () => {
  const weeks = monthGrid(2026, 10);
  assert.equal(weeks[0]?.[0], "2026-09-28");
  assert.equal(weeks[0]?.[3], "2026-10-01");
  assert.equal(weeks.at(-1)?.at(-1), "2026-11-01");
  assert.equal(weeks.length, 5);
  for (const w of weeks) assert.equal(w.length, 7);
});

test("monthGrid: un febrero que empieza en lunes cabe en 4 semanas exactas; febrero de 2026 empieza en domingo y ocupa 5", () => {
  // El 1 de febrero de 2027 es lunes: 28 días = 4 semanas exactas, sin días de los meses vecinos.
  const feb2027 = monthGrid(2027, 2);
  assert.equal(feb2027.length, 4);
  assert.equal(feb2027[0]?.[0], "2027-02-01");
  assert.equal(feb2027[3]?.[6], "2027-02-28");
  // El 1 de febrero de 2026 es domingo: la rejilla va del lunes 26/01 al domingo 01/03.
  const feb2026 = monthGrid(2026, 2);
  assert.equal(feb2026.length, 5);
  assert.equal(feb2026[0]?.[0], "2026-01-26");
  assert.equal(feb2026[0]?.[6], "2026-02-01");
  assert.equal(feb2026[4]?.[6], "2026-03-01");
  for (const w of [...feb2027, ...feb2026]) assert.equal(w.length, 7);
});

test("monthGrid: todas las semanas empiezan en lunes y son consecutivas", () => {
  for (let m = 1; m <= 12; m++) {
    const days = monthGrid(2026, m).flat();
    assert.equal(new Date(`${days[0]}T00:00:00Z`).getUTCDay(), 1);
    for (let i = 1; i < days.length; i++) assert.equal(Date.parse(`${days[i]}T00:00:00Z`) - Date.parse(`${days[i - 1]}T00:00:00Z`), 86_400_000);
  }
});

test("monthRange y shiftMonth cruzan bien los bordes de año y los febreros", () => {
  assert.deepEqual(monthRange(2026, 2), { from: "2026-02-01", to: "2026-02-28" });
  assert.deepEqual(monthRange(2028, 2), { from: "2028-02-01", to: "2028-02-29" });
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
});
