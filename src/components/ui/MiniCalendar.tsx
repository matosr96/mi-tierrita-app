import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import styles from "./MiniCalendar.module.css";

type Props = {
  /** Día elegido en YYYY-MM-DD (hora local), o null. */
  value: string | null;
  onChange: (iso: string) => void;
  /** Último día que se puede elegir (por defecto, hoy). */
  max?: string;
  ariaLabel?: string;
};

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
const monthLabel = (d: Date): string => {
  const text = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
};
const dayAria = (d: Date): string => d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/**
 * Mini calendario de un mes (lunes a domingo) para elegir un día: flechas para cambiar de mes, teclado con flechas
 * entre días (Inicio/Fin a los extremos de la semana, Re Pág/Av Pág de mes), Enter o espacio para elegir.
 */
export const MiniCalendar = ({ value, onChange, max, ariaLabel = "Elegir un día" }: Props) => {
  const today = toIso(new Date());
  const limit = max ?? today;
  const [cursor, setCursor] = useState<string>(value ?? today);
  const [view, setView] = useState<Date>(() => {
    const d = fromIso(value ?? today);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  // Si el valor cambia desde afuera (por ejemplo, "quitar el día"), el calendario lo sigue.
  useEffect(() => {
    if (value === null) return;
    setCursor(value);
    const d = fromIso(value);
    setView(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${cursor}"]`)?.focus();
  }, [cursor, view]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Lunes = 0 … domingo = 6.
  const lead = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))];
  while (cells.length % 7 !== 0) cells.push(null);

  const moveMonth = (delta: number) => setView(new Date(year, month + delta, 1));
  const canGoNext = toIso(new Date(year, month + 1, 1)) <= limit;

  const moveCursor = (days: number, months = 0) => {
    const d = fromIso(cursor);
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() + days);
    const iso = toIso(d);
    if (iso > limit) return;
    pendingFocus.current = true;
    setCursor(iso);
    setView(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, () => void> = {
      ArrowLeft: () => moveCursor(-1),
      ArrowRight: () => moveCursor(1),
      ArrowUp: () => moveCursor(-7),
      ArrowDown: () => moveCursor(7),
      Home: () => moveCursor(-((fromIso(cursor).getDay() + 6) % 7)),
      End: () => moveCursor(6 - ((fromIso(cursor).getDay() + 6) % 7)),
      PageUp: () => moveCursor(0, -1),
      PageDown: () => moveCursor(0, 1),
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  };

  return (
    <div className={styles.calendar} aria-label={ariaLabel} role="group">
      <div className={styles.head}>
        <button type="button" className={styles.nav} onClick={() => moveMonth(-1)} aria-label="Mes anterior" title="Mes anterior">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <strong aria-live="polite">{monthLabel(view)}</strong>
        <button type="button" className={styles.nav} onClick={() => moveMonth(1)} disabled={!canGoNext} aria-label="Mes siguiente" title="Mes siguiente">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <div ref={gridRef} className={styles.grid} role="grid" aria-label={monthLabel(view)} onKeyDown={onKey}>
        {cells.map((d, i) => {
          if (d === null) return <span key={`v-${i}`} className={styles.blank} aria-hidden="true" />;
          const iso = toIso(d);
          const disabled = iso > limit;
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              data-day={iso}
              tabIndex={iso === cursor ? 0 : -1}
              className={[styles.day, selected ? styles.selected : "", iso === today ? styles.today : ""].join(" ")}
              aria-label={dayAria(d)}
              aria-selected={selected}
              aria-current={iso === today ? "date" : undefined}
              disabled={disabled}
              onClick={() => {
                setCursor(iso);
                onChange(iso);
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
