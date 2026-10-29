import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chips, EmptyState, QueryState, Tabs, type TabOption } from "@/components/ui";
import { useCalendar } from "@/hooks/calendar";
import { addDaysIso, int, monthYear, todayIso } from "@/lib/format";
import type { CalendarPriority, CalendarSummary } from "@/types/api";
import { CalendarAgenda } from "./CalendarAgenda";
import { CalendarMonth } from "./CalendarMonth";
import { isoOf, monthRange, shiftMonth } from "./calendarGroups";
import styles from "./Calendar.module.css";

type View = "month" | "agenda";
type Props = {
  initialView?: View;
  /** Modo compacto: pide de hoy a hoy + days − 1 y muestra solo la agenda, sin navegación de meses ni filtros. */
  days?: number;
};

const VIEWS: TabOption<View>[] = [
  { value: "month", label: "Mes" },
  { value: "agenda", label: "Agenda" },
];
const PRIORITIES: { value: CalendarPriority | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
];
const ALL_AREAS = "__all__";

const count = (n: number, one: string, many: string): string => `${int(n)} ${n === 1 ? one : many}`;
const summaryLine = (s: CalendarSummary): string => `${count(s.pending, "pendiente", "pendientes")} · ${count(s.overdue, "vencido", "vencidos")} · ${count(s.done, "cerrado", "cerrados")}`;

const Arrow = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d={dir === "prev" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Calendario reutilizable (brief 31): lotes por vencer, cobros, alarmas propias y cierres de mes según el rol, en vista
 * Mes o Agenda, con filtros por prioridad y área. El resumen y los estados vienen de la API; al tocar un ítem se va a
 * su pantalla.
 */
export const Calendar = ({ initialView = "month", days }: Props) => {
  const navigate = useNavigate();
  const today = todayIso();
  const compactDays = days !== undefined && days > 0 ? days : null;
  const compact = compactDays !== null;
  const [view, setView] = useState<View>(compact ? "agenda" : initialView);
  const [cursor, setCursor] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }));
  const [priority, setPriority] = useState<CalendarPriority | "all">("all");
  const [area, setArea] = useState<string>(ALL_AREAS);
  const [selected, setSelected] = useState<string | null>(null);

  const range = compactDays !== null ? { from: today, to: addDaysIso(today, compactDays - 1) } : monthRange(cursor.year, cursor.month);
  const query = useCalendar(range);
  const items = query.data?.items ?? [];
  const areas = useMemo(() => [...new Set(items.map((i) => i.area))], [items]);
  const filtered = items.filter((i) => (priority === "all" || i.priority === priority) && (area === ALL_AREAS || i.area === area));
  const monthLabel = monthYear(isoOf(cursor.year, cursor.month, 1));

  const goMonth = (delta: number) => {
    setCursor((c) => shiftMonth(c.year, c.month, delta));
    setSelected(null);
  };
  const goToday = () => {
    setCursor({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) });
    setSelected(today);
  };
  const clearFilters = () => {
    setPriority("all");
    setArea(ALL_AREAS);
  };

  const emptyRange = (
    <EmptyState
      title={compact ? `Nada programado en los próximos ${int(compactDays)} días` : `Nada programado en ${monthLabel.toLowerCase()}`}
      text="Aquí aparecen los lotes por vencer, los cobros, sus alarmas y los cierres de mes que le corresponden."
      action={
        <Button size="sm" variant="secondary" onClick={() => navigate("/alarmas")}>
          Programar una alarma
        </Button>
      }
    />
  );
  const emptyFiltered = (
    <EmptyState
      title="Ningún ítem con estos filtros"
      action={
        <Button size="sm" variant="secondary" onClick={clearFilters}>
          Quitar filtros
        </Button>
      }
    />
  );

  return (
    <div className={[styles.calendar, compact ? styles.compact : ""].join(" ")}>
      {compact ? null : (
        <div className={styles.toolbar}>
          <div className={styles.monthNav}>
            <button type="button" className={styles.navBtn} onClick={() => goMonth(-1)} aria-label="Mes anterior" title="Mes anterior">
              <Arrow dir="prev" />
            </button>
            <strong className={styles.monthLabel} aria-live="polite">
              {monthLabel}
            </strong>
            <button type="button" className={styles.navBtn} onClick={() => goMonth(1)} aria-label="Mes siguiente" title="Mes siguiente">
              <Arrow dir="next" />
            </button>
            <Button size="sm" variant="secondary" onClick={goToday}>
              Hoy
            </Button>
          </div>
          <Tabs options={VIEWS} value={view} onChange={setView} ariaLabel="Vista del calendario" />
        </div>
      )}

      {query.data ? (
        <p className={styles.summary} aria-live="polite">
          {summaryLine(query.data.summary)}
        </p>
      ) : null}

      {compact || items.length === 0 ? null : (
        <div className={styles.filters}>
          <div className={styles.filterRow} role="group" aria-label="Filtrar por prioridad">
            <span className={styles.filterLabel}>Prioridad</span>
            <Chips options={PRIORITIES} value={priority} onChange={setPriority} />
          </div>
          {areas.length > 1 ? (
            <div className={styles.filterRow} role="group" aria-label="Filtrar por área">
              <span className={styles.filterLabel}>Área</span>
              <Chips options={[{ value: ALL_AREAS, label: "Todas" }, ...areas.map((a) => ({ value: a, label: a }))]} value={area} onChange={setArea} />
            </div>
          ) : null}
        </div>
      )}

      <div className={query.isPlaceholderData ? styles.busy : undefined}>
        <QueryState query={query} isEmpty={(r) => view === "agenda" && r.items.length === 0} empty={emptyRange}>
          {(r) =>
            view === "month" ? (
              <>
                <CalendarMonth year={cursor.year} month={cursor.month} items={filtered} selected={selected} onSelect={setSelected} onShiftMonth={goMonth} />
                {r.items.length === 0 ? emptyRange : filtered.length === 0 ? emptyFiltered : null}
              </>
            ) : filtered.length === 0 ? (
              emptyFiltered
            ) : (
              <CalendarAgenda items={filtered} />
            )
          }
        </QueryState>
      </div>

      {compact ? (
        <div className={styles.compactFoot}>
          <Button size="sm" variant="ghost" onClick={() => navigate("/calendario")}>
            Abrir el calendario
          </Button>
        </div>
      ) : null}
    </div>
  );
};
