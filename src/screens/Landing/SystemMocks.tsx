import type { CSSProperties } from "react";
import styles from "./SystemMocks.module.css";

/**
 * Minipantallas ilustrativas de "El sistema por dentro". Cada una recibe el paso (0, 1 o 2) y lo cuenta con
 * transiciones CSS; las cifras son de ejemplo y no representan datos de la tienda.
 */
type Props = { step: number };

const LOTS = [
  { code: "L-18", due: "Vencido", tone: "bad", fill: 8 },
  { code: "L-21", due: "Vence en 9 días", tone: "warn", fill: 26 },
  { code: "L-24", due: "Vence en 2 meses", tone: "good", fill: 62 },
  { code: "L-27", due: "Vence en 5 meses", tone: "good", fill: 92 },
] as const;

/** Inventario FEFO: llega un lote, el estante se ordena por vencimiento y sale primero el que vence antes. */
export const FefoMock = ({ step }: Props) => (
  <div className={styles.panel} data-step={step}>
    <div className={styles.panelHead}>
      <span>
        <strong>Desparasitante oral 500 ml</strong>
        <small>Lotes en bodega</small>
      </span>
      <span className={styles.chip}>{step === 0 ? "Compra nueva" : step === 1 ? "Orden por vencimiento" : "Salida FEFO"}</span>
    </div>
    <div className={styles.scale}>
      <span>Vence antes</span>
      <i />
      <span>Vence después</span>
    </div>
    <ul className={styles.lots}>
      {LOTS.map((l, i) => (
        <li
          key={l.code}
          className={styles.lot}
          data-tone={l.tone}
          data-new={i === 3 ? "1" : "0"}
          data-out={i === 1 ? "1" : "0"}
          style={{ "--i": i, "--fill": `${l.fill}%` } as CSSProperties}
        >
          <code>{l.code}</code>
          <span className={styles.lotBar}>
            <i />
          </span>
          <small>{l.due}</small>
          {i === 1 ? <em className={styles.lotTag}>Sale primero</em> : null}
          {i === 0 ? <em className={styles.lotStamp}>Vencido</em> : null}
        </li>
      ))}
    </ul>
  </div>
);

const BALANCE = [
  { saldo: "$ 350.000", fill: 35 },
  { saldo: "$ 530.000", fill: 53 },
  { saldo: "$ 330.000", fill: 33 },
];

/** Ventas y cartera: la factura sale, el saldo sube sin pasar el cupo y el abono lo baja. */
export const CarteraMock = ({ step }: Props) => {
  const b = BALANCE[step] ?? BALANCE[0]!;
  return (
    <div className={styles.panel} data-step={step}>
      <div className={styles.panelHead}>
        <span>
          <strong>Cliente de ejemplo</strong>
          <small>Crédito · cupo $ 1.000.000</small>
        </span>
        <span className={styles.chip}>{step === 2 ? "Abono registrado" : step === 1 ? "Venta a crédito" : "Factura"}</span>
      </div>
      <div className={styles.ticket}>
        <span>
          <code>FV-0142</code>
          <small>Concentrado lechero · 4 bultos</small>
        </span>
        <strong>$ 180.000</strong>
      </div>
      <div className={styles.balance}>
        <span className={styles.balanceRow}>
          <small>Saldo del cliente</small>
          <strong key={b.saldo} className={styles.balanceValue}>
            {b.saldo}
          </strong>
        </span>
        <span className={styles.track}>
          <i style={{ "--fill": `${b.fill}%` } as CSSProperties} />
          <b aria-hidden="true" />
        </span>
        <span className={styles.trackLegend}>
          <small>$ 0</small>
          <small>Cupo</small>
        </span>
      </div>
      <div className={styles.payment}>
        <span className={styles.paymentIcon}>↓</span>
        <span>
          <strong>Abono $ 200.000</strong>
          <small>El saldo baja al instante</small>
        </span>
      </div>
    </div>
  );
};

const SCENARIOS = [
  { name: "Actual", vpn: 34, tone: "neutral" },
  { name: "Ampliar", vpn: 78, tone: "good" },
  { name: "Ampliar a crédito", vpn: -40, tone: "bad" },
] as const;

/** Decisión de ampliar: cada escenario es una barra; el piso es VPN = 0 y el sistema señala el que conviene. */
export const ScenariosMock = ({ step }: Props) => (
  <div className={styles.panel} data-step={step}>
    <div className={styles.panelHead}>
      <span>
        <strong>Escenarios del local</strong>
        <small>VPN a 5 años</small>
      </span>
      <span className={styles.chip}>{step === 0 ? "Escenarios" : step === 1 ? "Piso VPN = 0" : "Recomendación"}</span>
    </div>
    <div className={styles.chart}>
      <span className={styles.zero}>
        <small>VPN = 0</small>
      </span>
      {SCENARIOS.map((s, i) => (
        <span key={s.name} className={styles.col} data-tone={s.tone} style={{ "--v": Math.abs(s.vpn) / 100, "--i": i } as CSSProperties}>
          <span className={styles.colUp}>{s.vpn > 0 ? <i /> : null}</span>
          <span className={styles.colDown}>{s.vpn < 0 ? <i /> : null}</span>
          <small>{s.name}</small>
          {s.tone === "good" ? <em className={styles.best}>Conviene</em> : null}
          {s.tone === "bad" ? <em className={styles.worst}>No conviene</em> : null}
        </span>
      ))}
    </div>
  </div>
);
