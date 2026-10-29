import { useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { ChartFrame } from "./ChartFrame";
import { useChartHover } from "./useChartHover";
import styles from "./charts.module.css";

export type HeatmapDatum = { date: string; value: number };

type Props = {
  /** Valor por día (ISO `YYYY-MM-DD`); los días del período sin dato se pintan vacíos. */
  data: HeatmapDatum[];
  from: string;
  to: string;
  format: (v: number) => string;
  formatDate?: (iso: string) => string;
  /** Nombre accesible del gráfico. */
  title?: string;
  /** Al tocar un día (clic, Enter o espacio) con su fecha ISO. */
  onSelect?: ((date: string) => void) | undefined;
};

type Cell = { date: string; value: number | null; col: number; row: number };

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const parse = (iso: string): Date => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mondayFirst = (d: Date): number => (d.getDay() + 6) % 7;

/**
 * Mapa de calor por día: columnas = semanas, filas = lunes a domingo; cinco tonos del verde de la marca según el valor.
 * El SVG es enfocable: ← → cambian de día, ↑ ↓ de semana, Enter abre el detalle; con el puntero, cada celda muestra su valor.
 */
export const HeatmapCalendar = ({ data, from, to, format, formatDate = (iso) => iso, title, onSelect }: Props) => {
  const hover = useChartHover();
  const [focusWithin, setFocusWithin] = useState(false);
  const values = new Map(data.map((d) => [d.date, d.value]));
  const max = Math.max(...data.map((d) => d.value), 0);

  const start = parse(from);
  start.setDate(start.getDate() - mondayFirst(start));
  const end = parse(to);
  const cells: Cell[] = [];
  const monthLabels: { col: number; text: string }[] = [];
  let labeledMonth = "";
  let lastLabelCol = -10;
  for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i += 1) {
    const iso = toIso(d);
    const col = Math.floor(i / 7);
    const inPeriod = iso >= from && iso <= to;
    const month = iso.slice(0, 7);
    // Rótulo del mes sobre la semana donde empieza; el primero lleva el año y los demás se omiten si no hay sitio
    // (tres columnas) para que no se monten unos sobre otros.
    if (inPeriod && month !== labeledMonth && col - lastLabelCol >= 3) {
      monthLabels.push({ col, text: monthLabels.length === 0 ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : MONTHS[d.getMonth()]! });
      labeledMonth = month;
      lastLabelCol = col;
    }
    cells.push({ date: iso, value: inPeriod ? (values.get(iso) ?? 0) : null, col, row: mondayFirst(d) });
  }
  const weeks = (cells[cells.length - 1]?.col ?? 0) + 1;
  const cellSize = 16;
  const gap = 3;
  const left = 22;
  const top = 18;
  const width = left + weeks * (cellSize + gap);
  const height = top + 7 * (cellSize + gap);
  const level = (v: number | null): number => (v === null || v <= 0 || max <= 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  const selectable = cells.map((c, i) => (c.value !== null ? i : -1)).filter((i) => i >= 0);
  const active = hover.active !== null ? cells[hover.active] : undefined;
  const x = (c: Cell) => left + c.col * (cellSize + gap);
  const y = (c: Cell) => top + c.row * (cellSize + gap);

  const move = (delta: number) =>
    hover.setActive((a) => {
      const current = a ?? selectable[0] ?? 0;
      const next = current + delta;
      return cells[next]?.value !== null && next >= 0 && next < cells.length ? next : current;
    });
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, number> = { ArrowRight: 7, ArrowLeft: -7, ArrowDown: 1, ArrowUp: -1 };
    if (e.key === "Escape") hover.setActive(null);
    else if (e.key in moves) {
      e.preventDefault();
      move(moves[e.key]!);
    } else if ((e.key === "Enter" || e.key === " ") && onSelect && active) {
      e.preventDefault();
      onSelect(active.date);
    }
  };

  return (
    <ChartFrame svgRef={hover.svgRef} anchor={active ? { x: x(active) + cellSize / 2, y: y(active) } : null} tip={active ? { label: formatDate(active.date), value: format(active.value ?? 0) } : null}>
      <svg
        ref={hover.svgRef}
        className={[styles.svg, styles.heatmap, styles.interactive].join(" ")}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: width * 1.4 }}
        role="group"
        aria-label={title ?? `Mapa de calor por día del ${formatDate(from)} al ${formatDate(to)}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => {
          setFocusWithin(true);
          hover.setActive((a) => a ?? selectable[0] ?? null);
        }}
        onBlur={(e: FocusEvent) => {
          if (!e.relatedTarget || !hover.svgRef.current?.contains(e.relatedTarget as Node)) {
            setFocusWithin(false);
            hover.setActive(null);
          }
        }}
        onPointerLeave={(e: PointerEvent) => {
          if (e.pointerType !== "touch" && !focusWithin) hover.setActive(null);
        }}
      >
        {WEEKDAYS.map((w, r) => (
          <text key={w} x={left - 6} y={top + r * (cellSize + gap) + cellSize - 4} textAnchor="end" className={styles.heatLabel}>
            {w}
          </text>
        ))}
        {monthLabels.map((m) => (
          <text key={m.text} x={left + m.col * (cellSize + gap)} y={top - 7} className={styles.heatLabel}>
            {m.text}
          </text>
        ))}
        {cells.map((c, i) => (
          <rect
            key={c.date}
            x={x(c)}
            y={y(c)}
            width={cellSize}
            height={cellSize}
            rx={4}
            className={[c.value === null ? styles.heatOut : styles[`heat${level(c.value)}`], c.value !== null ? styles.heatCell : "", hover.active === i ? styles.heatOn : ""].join(" ")}
            role={c.value === null ? undefined : "img"}
            aria-label={c.value === null ? undefined : `${formatDate(c.date)}: ${format(c.value)}`}
            onPointerEnter={c.value === null ? undefined : () => hover.setActive(i)}
            onPointerDown={c.value === null ? undefined : () => hover.setActive(i)}
            onClick={c.value === null || !onSelect ? undefined : () => onSelect(c.date)}
          />
        ))}
      </svg>
    </ChartFrame>
  );
};
