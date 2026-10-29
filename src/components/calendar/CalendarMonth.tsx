import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { addDaysIso, dayHeading, dayLong, monthYear, todayIso } from "@/lib/format";
import type { CalendarItem } from "@/types/api";
import { CalendarItemRow } from "./CalendarItemRow";
import { STATUS_LABEL, groupByDay, isoOf, monthGrid, toneOf } from "./calendarGroups";
import styles from "./Calendar.module.css";

type Props = {
  year: number;
  /** 1 a 12. */
  month: number;
  items: CalendarItem[];
  /** Día abierto debajo de la rejilla, o null. */
  selected: string | null;
  onSelect: (iso: string | null) => void;
  /** El teclado cruzó al mes anterior o al siguiente. */
  onShiftMonth: (delta: number) => void;
};

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
/** Píldoras visibles por día; el resto se resume en «+N». */
const MAX_PILLS = 3;
const TONE_CLASS = { bad: styles.toneBad, done: styles.toneDone, warn: styles.toneWarn, pending: styles.tonePending };

const dayAria = (iso: string, items: CalendarItem[], isToday: boolean): string => {
  const what = items.length === 0 ? "sin ítems" : items.map((i) => `${i.title} (${STATUS_LABEL[i.status].toLowerCase()})`).join("; ");
  return `${dayLong(iso)}${isToday ? ", hoy" : ""}: ${what}`;
};

/**
 * Mes en rejilla de lunes a domingo con píldoras por día. Cada día es un botón con su rótulo completo; las flechas se
 * mueven entre días (Inicio/Fin a los extremos de la semana) y al cruzar el borde cambian de mes. Al tocar un día se
 * abre su lista debajo.
 */
export const CalendarMonth = ({ year, month, items, selected, onSelect, onShiftMonth }: Props) => {
  const today = todayIso();
  const prefix = isoOf(year, month, 1).slice(0, 7);
  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const byDay = useMemo(() => new Map(groupByDay(items).map((g) => [g.date, g.items])), [items]);
  const [cursor, setCursor] = useState<string>(selected ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  // El día enfocable: el cursor si está en el mes; si no, el abierto, hoy o el día 1.
  const active = cursor.startsWith(prefix) ? cursor : selected?.startsWith(prefix) ? selected : today.startsWith(prefix) ? today : `${prefix}-01`;

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${active}"]`)?.focus();
  }, [active]);

  const moveTo = (iso: string) => {
    pendingFocus.current = true;
    setCursor(iso);
    if (iso.slice(0, 7) !== prefix) onShiftMonth(iso.slice(0, 7) > prefix ? 1 : -1);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const weekday = (new Date(`${active}T00:00:00Z`).getUTCDay() + 6) % 7;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday };
    const delta = moves[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    moveTo(addDaysIso(active, delta));
  };

  const selectedItems = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className={styles.month}>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div ref={gridRef} className={styles.grid} role="group" aria-label={monthYear(`${prefix}-01`)} onKeyDown={onKey}>
        {weeks.flat().map((iso) => {
          const day = Number(iso.slice(8));
          if (!iso.startsWith(prefix))
            return (
              <span key={iso} className={[styles.cell, styles.outside].join(" ")} aria-hidden="true">
                <span className={styles.dayNum}>{day}</span>
              </span>
            );
          const dayItems = byDay.get(iso) ?? [];
          const isToday = iso === today;
          const isSelected = iso === selected;
          const extra = dayItems.length - MAX_PILLS;
          return (
            <button
              key={iso}
              type="button"
              data-day={iso}
              tabIndex={iso === active ? 0 : -1}
              className={[styles.cell, styles.day, isToday ? styles.today : "", isSelected ? styles.selected : ""].join(" ")}
              aria-label={dayAria(iso, dayItems, isToday)}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => {
                setCursor(iso);
                onSelect(isSelected ? null : iso);
              }}
            >
              <span className={styles.dayNum}>{day}</span>
              {dayItems.length > 0 ? (
                <span className={styles.pills} aria-hidden="true">
                  {dayItems.slice(0, MAX_PILLS).map((item) => (
                    <span key={item.id} className={[styles.pill, TONE_CLASS[toneOf(item)]].join(" ")}>
                      <span className={styles.pillText}>{item.title}</span>
                    </span>
                  ))}
                  {extra > 0 ? <span className={styles.more}>+{extra}</span> : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {selected?.startsWith(prefix) ? (
        <section className={styles.dayPanel} aria-live="polite" aria-label={`Ítems del ${dayLong(selected)}`}>
          <h3 className={styles.agendaHead}>
            {dayHeading(selected)}
            {selected === today ? <span className={styles.todayTag}>Hoy</span> : null}
          </h3>
          {selectedItems.length === 0 ? (
            <p className={styles.dayEmpty}>Nada programado este día.</p>
          ) : (
            <ul className={styles.list}>
              {selectedItems.map((item) => (
                <CalendarItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
};
