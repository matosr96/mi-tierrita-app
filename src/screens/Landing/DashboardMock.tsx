import type { CSSProperties } from "react";
import { BrandMark } from "@/components/layout/AppShell";
import { ICONS } from "@/router/navigation";
import styles from "./DashboardMock.module.css";

/** Barras finas de un minigráfico (alturas en %, solo de ejemplo). */
export const MiniBars = ({ values, tone = "sprout", className }: { values: number[]; tone?: "sprout" | "warn" | "bad"; className?: string }) => (
  <span className={[styles.bars, styles[tone], className ?? ""].join(" ")} aria-hidden="true">
    {values.map((v, i) => (
      <i key={i} style={{ "--h": `${v}%`, "--i": i } as CSSProperties} />
    ))}
  </span>
);

const Icon = ({ paths }: { paths: string }) => <svg viewBox="0 0 22 22" dangerouslySetInnerHTML={{ __html: paths }} />;

/** La misma píldora de la app: círculos solo de ícono, el activo en blanco. */
const NAV: { icon: string; active?: boolean; badge?: number }[] = [
  { icon: ICONS.home, active: true },
  { icon: ICONS.inventory },
  { icon: ICONS.batches, badge: 3 },
  { icon: ICONS.sales },
  { icon: ICONS.customers },
  { icon: ICONS.finance },
  { icon: ICONS.reports },
  { icon: '<circle cx="5.5" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="11" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="16.5" cy="11" r="1.4" fill="currentColor" stroke="none"/>' },
];

/** Los cuatro indicadores reales del Inicio de administración, con cifras de ejemplo. */
const KPIS = [
  { label: "Ventas del mes", value: "$ 18,4 M", hint: "+12 % frente a septiembre", bars: [38, 52, 44, 61, 57, 70, 66, 82], tone: "sprout" as const },
  { label: "Valor del inventario", value: "$ 46,2 M", hint: "a costo · hoy", bars: [58, 60, 57, 62, 64, 61, 66, 68], tone: "sprout" as const },
  { label: "Cartera vencida", value: "$ 2,1 M", hint: "6 clientes · más de 30 días", bars: [64, 58, 60, 48, 52, 40, 36, 30], tone: "bad" as const },
  { label: "Ticket promedio", value: "$ 86 mil", hint: "214 ventas en el mes", bars: [40, 46, 44, 52, 50, 58, 54, 60], tone: "sprout" as const },
];

/** Ventas por día del mes (pesos de ejemplo, en miles): la línea del Inicio. */
const DAYS = [420, 610, 540, 760, 690, 980, 520, 640, 720, 590, 860, 940, 700, 1080, 820, 760];
const W = 600;
const H = 150;
const max = Math.max(...DAYS);
const pts = DAYS.map((v, i) => [(i / (DAYS.length - 1)) * W, H - (v / max) * (H - 16) - 4] as const);
const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const area = `${line} L${W} ${H} L0 ${H} Z`;
const last = pts[pts.length - 1] ?? [W, 0];

const PENDING = [
  { text: "3 lotes vencidos en bodega", tag: "$ 412.000", tone: "bad" },
  { text: "Concentrado lechero vence en 6 días", tag: "FEFO", tone: "bad" },
  { text: "6 clientes con cartera vencida", tag: "$ 2,1 M", tone: "warn" },
] as const;

/**
 * Pantalla ilustrativa del Inicio de administración, hecha con divs a escala de la app real: franja verde con la barra
 * alta y la navegación en círculos, saludo en blanco con el abanico de vidrio, indicadores, ventas día a día y la
 * tarjeta de pendientes. No es una captura ni muestra datos reales. Todo se mide en `em` sobre una letra base que sigue
 * el ancho del marco, así escala como una imagen.
 */
export const DashboardMock = () => (
  <div className={styles.frame} aria-hidden="true">
    <div className={styles.chrome}>
      <span className={styles.dots}>
        <i />
        <i />
        <i />
      </span>
      <span className={styles.url}>mitierrita · inicio</span>
    </div>
    <div className={styles.screen}>
      <div className={styles.topbar}>
        <span className={styles.brand}>
          <BrandMark size={18} />
          <span>
            Mi Tierrita
            <small>Agropecuaria</small>
          </span>
        </span>
        <span className={styles.nav}>
          {NAV.map((n, i) => (
            <span key={i} className={[styles.circle, n.active ? styles.circleOn : ""].join(" ")}>
              <Icon paths={n.icon} />
              {n.badge ? <b className={styles.badge}>{n.badge}</b> : null}
            </span>
          ))}
        </span>
        <span className={styles.tools}>
          <span className={styles.tool}>
            <svg viewBox="0 0 20 20">
              <circle cx="8.8" cy="8.8" r="6" />
              <line x1="13.2" y1="13.2" x2="17.5" y2="17.5" />
            </svg>
          </span>
          <span className={styles.tool}>
            <svg viewBox="0 0 20 20">
              <path d="M5 13.5 V9 a5 5 0 0 1 10 0 V13.5 L16.5 15 H3.5 Z" />
              <path d="M8.2 17 a1.9 1.9 0 0 0 3.6 0" />
            </svg>
            <b className={styles.badge}>4</b>
          </span>
          <span className={styles.avatar}>AD</span>
        </span>
      </div>

      <div className={styles.hero}>
        <div className={styles.fan}>
          {[-72, -48, -24, 0, 24, 48, 72].map((deg, i) => (
            <span key={deg} className={i >= 4 ? styles.solid : undefined} style={{ "--deg": `${deg}deg`, "--i": i } as CSSProperties} />
          ))}
        </div>
        <div className={styles.greeting}>
          <small>Panel de administración</small>
          <strong>Buenos días, equipo.</strong>
          <span>Así va la tienda · cierre de octubre en 15 días</span>
        </div>
        <div className={styles.side}>
          <span className={styles.pills}>
            <span>
              Rol <b>Administración</b>
            </span>
            <span>
              Estado <em>En línea</em>
            </span>
          </span>
          <span className={styles.actions}>
            <span className={styles.ghost}>Ver reportes</span>
            <span className={styles.white}>Nueva venta</span>
          </span>
        </div>
      </div>

      <div className={styles.kpis}>
        {KPIS.map((k, i) => (
          <div key={k.label} className={styles.kpi} style={{ "--i": i } as CSSProperties}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <strong className={styles.kpiValue}>{k.value}</strong>
            <span className={styles.kpiFoot}>
              <small>{k.hint}</small>
              <MiniBars values={k.bars} tone={k.tone} />
            </span>
          </div>
        ))}
      </div>

      <div className={styles.dash}>
        <div className={styles.card}>
          <span className={styles.cardTitle}>Ventas del mes, día a día</span>
          <small className={styles.cardSub}>Octubre · pesos por día con ventas</small>
          <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="mockArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sprout)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--sprout)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className={styles.grid} />
            ))}
            <path d={area} fill="url(#mockArea)" className={styles.area} />
            <path d={line} className={styles.line} pathLength={1} />
            <circle cx={last[0] - 3} cy={last[1]} r="5" className={styles.dot} />
          </svg>
        </div>
        <div className={styles.spot}>
          <span className={styles.spotTag}>3 pendientes</span>
          <strong>3 cosas requieren su atención hoy.</strong>
          <ul>
            {PENDING.map((p) => (
              <li key={p.text}>
                <i data-tone={p.tone} />
                <span>{p.text}</span>
                <small>{p.tag}</small>
              </li>
            ))}
          </ul>
          <span className={styles.spotBtn}>Ver detalle →</span>
        </div>
      </div>
    </div>
  </div>
);
