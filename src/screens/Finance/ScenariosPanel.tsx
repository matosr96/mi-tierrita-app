import { useMemo, useState, type ReactNode } from "react";
import { useBivariate, useCompareScenarios, useSensitivity, useTornado } from "@/hooks/financial";
import type { ScenarioDetail, ScenarioSummary, SensitivityVariable } from "@/types/api";
import { Badge, Button, Card, Chips, DataTable, EmptyState, QueryState, type Column } from "@/components/ui";
import { LineChart, TornadoChart } from "@/components/charts";
import { money, moneyCompact, num2, pct, times, years } from "@/lib/format";
import { breakEven, formatSensitivityX, pointsBetween, scenarioStatus, SENSITIVITY_LABELS, SENSITIVITY_OPTIONS, TORNADO_LABELS } from "./financeShared";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail; scenarios: ScenarioSummary[]; onNew: () => void; onDuplicate: () => void };

const MAX_COMPARED = 6;

type CompareRow = { key: string; label: string; strong?: boolean; render: (s: ScenarioSummary) => ReactNode };

const signed = (value: number | null, format: (v: number | null) => string): ReactNode =>
  value !== null && value < 0 ? <span className="negative">{format(value)}</span> : format(value);

const COMPARE_ROWS: CompareRow[] = [
  { key: "totalInvestment", label: "Inversión total", render: (s) => money(s.indicators.totalInvestment) },
  { key: "credit", label: "Crédito", render: (s) => money(s.indicators.credit) },
  { key: "ownContribution", label: "Aporte propio requerido", strong: true, render: (s) => <strong>{money(s.indicators.ownContribution)}</strong> },
  { key: "installment", label: "Cuota mensual", render: (s) => money(s.indicators.installment) },
  { key: "totalInterest", label: "Intereses totales", render: (s) => money(s.indicators.totalInterest) },
  { key: "npv", label: "VPN del proyecto", strong: true, render: (s) => <strong>{signed(s.indicators.npv, money)}</strong> },
  { key: "irr", label: "TIR del proyecto", render: (s) => signed(s.indicators.irr, pct) },
  {
    key: "paybackDiscounted",
    label: "Recuperación descontada",
    render: (s) => (s.indicators.paybackDiscounted === null ? <span className="negative">{years(null)}</span> : years(s.indicators.paybackDiscounted)),
  },
  { key: "profitabilityIndex", label: "Índice de rentabilidad", render: (s) => (s.indicators.profitabilityIndex < 1 ? <span className="negative">{num2(s.indicators.profitabilityIndex)}</span> : num2(s.indicators.profitabilityIndex)) },
  { key: "benefitCostRatio", label: "Relación B/C convencional", render: (s) => (s.indicators.benefitCostRatio < 1 ? <span className="negative">{num2(s.indicators.benefitCostRatio)}</span> : num2(s.indicators.benefitCostRatio)) },
  { key: "investorNpv", label: "VPN del inversionista", render: (s) => signed(s.indicators.investorNpv, money) },
  {
    key: "coverageIncremental",
    label: "Cobertura incremental",
    render: (s) => (s.indicators.coverageIncremental !== null && s.indicators.coverageIncremental < 1 ? <span className="negative">{times(s.indicators.coverageIncremental)}</span> : times(s.indicators.coverageIncremental)),
  },
  {
    key: "status",
    label: "Estado",
    render: (s) => {
      const st = scenarioStatus(s.indicators);
      return <Badge tone={st.tone}>{st.label}</Badge>;
    },
  },
];

/** Pestaña "Escenarios y sensibilidad": Tabla 7 de comparación, Tablas 8-10 (univariante), 11 (tornado) y 12 (bivariante). */
export const ScenariosPanel = ({ scenario, scenarios, onNew, onDuplicate }: Props) => {
  const compareIds = useMemo(() => [scenario.id, ...scenarios.filter((s) => s.id !== scenario.id).map((s) => s.id)].slice(0, MAX_COMPARED), [scenario.id, scenarios]);
  const compare = useCompareScenarios(compareIds);
  const [variable, setVariable] = useState<SensitivityVariable>("salesIncrease");
  const sensitivity = useSensitivity(scenario.id, variable);
  const tornado = useTornado(scenario.id);
  const bivariate = useBivariate(scenario.id, "salesIncrease", "inventoryTurnover");

  const highlightX = variable === "salesIncrease" ? scenario.salesIncrease : variable === "inventoryTurnover" ? scenario.assumptions.inventoryTurnover : scenario.assumptions.tmarEA;
  const formatX = formatSensitivityX(variable);

  const renderTable = (list: ScenarioSummary[]) => {
    const columns: Column<CompareRow>[] = [
      { key: "label", header: "Indicador", render: (r) => (r.strong ? <strong>{r.label}</strong> : r.label) },
      ...list.map<Column<CompareRow>>((s) => ({
        key: String(s.id),
        header: (
          <span className={s.id === scenario.id ? styles.current : undefined}>
            {s.name}
            {s.id === scenario.id ? <span className={styles.currentTag}>actual</span> : null}
          </span>
        ),
        align: "right",
        render: (r) => r.render(s),
      })),
    ];
    return <DataTable<CompareRow> columns={columns} rows={COMPARE_ROWS} rowKey={(r) => r.key} />;
  };

  return (
    <div className={styles.panel}>
      <Card
        title="Comparación de escenarios"
        subtitle={compareIds.length >= 2 ? `Los ${compareIds.length} escenarios más recientes (máximo ${MAX_COMPARED})` : "Solo hay un escenario: cree otro para comparar"}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={onDuplicate}>
              Duplicar
            </Button>
            <Button size="sm" onClick={onNew}>
              Nuevo escenario
            </Button>
          </>
        }
        flush
      >
        {compareIds.length >= 2 ? (
          <QueryState query={compare} isEmpty={(d) => d.scenarios.length === 0} empty={<EmptyState title="Nada que comparar" text="La API no devolvió escenarios." />}>
            {(data) => renderTable(data.scenarios)}
          </QueryState>
        ) : (
          renderTable([scenario])
        )}
        <div className={styles.cardFoot} style={{ padding: "12px 20px 16px" }}>
          Recomendado: VPN positivo y la ampliación cubre su propia cuota. Viable: VPN positivo, pero el negocio actual completa la cuota. Descartado: VPN negativo a la TMAR.
        </div>
      </Card>

      <div className={styles.two}>
        <Card title="Cuánto puede fallar cada supuesto" subtitle="VPN del escenario actual al variar un supuesto con los demás fijos">
          <div className={styles.chartHead}>
            <Chips options={SENSITIVITY_OPTIONS} value={variable} onChange={setVariable} />
          </div>
          <QueryState query={sensitivity} isEmpty={(d) => d.points.length === 0} empty={<EmptyState title="Sin puntos" text="La API no devolvió puntos para esta variable." />}>
            {(data) => {
              const be = breakEven(data.points);
              return (
                <>
                  <LineChart
                    points={data.points.map((p) => ({ x: p.value, y: p.npv }))}
                    formatX={formatX}
                    formatY={moneyCompact}
                    marker={be !== null ? { x: be, label: `equilibrio aprox. ${formatX(be)}` } : undefined}
                    highlightX={highlightX}
                  />
                  <p className={styles.caption}>
                    {SENSITIVITY_LABELS[variable]} · caso base {formatX(highlightX)}
                  </p>
                  {be !== null && variable === "salesIncrease" ? (
                    <div className={[styles.reading, scenario.salesIncrease >= be ? styles.readingGood : styles.readingBad].join(" ")}>
                      {scenario.salesIncrease >= be ? (
                        <>
                          Las ventas pueden quedarse <strong>{pointsBetween(scenario.salesIncrease, be)} puntos</strong> por debajo de lo esperado antes de que la ampliación destruya valor (equilibrio aprox. {pct(be)}).
                        </>
                      ) : (
                        <>
                          Faltan <strong>{pointsBetween(scenario.salesIncrease, be)} puntos</strong> de aumento de ventas para llegar al equilibrio aprox. de {pct(be)}.
                        </>
                      )}
                    </div>
                  ) : be !== null ? (
                    <p className={styles.note}>Equilibrio aprox. en {formatX(be)}: por encima o por debajo de ese valor el VPN cambia de signo.</p>
                  ) : (
                    <p className={styles.note}>El VPN no cambia de signo en el rango evaluado.</p>
                  )}
                </>
              );
            }}
          </QueryState>
        </Card>

        <Card title="Qué supuesto mueve más el resultado" subtitle="VPN cuando cada supuesto se mueve y los demás quedan en su valor base">
          <QueryState query={tornado} isEmpty={(d) => d.bars.length === 0} empty={<EmptyState title="Sin tornado" text="La API no devolvió barras." />}>
            {(data) => (
              <>
                <TornadoChart
                  data={[...data.bars].sort((x, y) => y.amplitude - x.amplitude).map((b) => ({ label: TORNADO_LABELS[b.variable] ?? b.variable, low: b.npvLow, high: b.npvHigh }))}
                  base={data.baseNpv}
                  format={moneyCompact}
                />
                <div className={styles.legend}>
                  <span>
                    <i className={[styles.swatch, styles.swatchSprout].join(" ")} />
                    variable −{pct(data.delta)}
                  </span>
                  <span>
                    <i className={styles.swatch} />
                    variable +{pct(data.delta)}
                  </span>
                </div>
                <p className={styles.note} style={{ marginTop: 10 }}>
                  Una barra sin ancho significa que ese supuesto no afecta el VPN del proyecto (por ejemplo la tasa del crédito, que solo cambia el flujo del inversionista).
                </p>
              </>
            )}
          </QueryState>
        </Card>
      </div>

      <Card title="Ventas × rotación del inventario" subtitle="VPN del proyecto para cada combinación de aumento de ventas (columnas) y rotación (filas)">
        <QueryState query={bivariate} isEmpty={(d) => d.xValues.length === 0 || d.yValues.length === 0} empty={<EmptyState title="Sin cuadrícula" text="La API no devolvió la sensibilidad bivariante." />}>
          {(data) => (
            <>
              <div className={styles.heatWrap}>
                <table className={styles.heat}>
                  <thead>
                    <tr>
                      <th className={styles.corner}>Rotación \ Ventas</th>
                      {data.xValues.map((x) => (
                        <th key={x}>{pct(x)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.yValues.map((y, yi) => (
                      <tr key={y}>
                        <th>{times(y)}</th>
                        {data.xValues.map((x, xi) => {
                          const v = data.npv[yi]?.[xi];
                          const isBase = x === scenario.salesIncrease && y === scenario.assumptions.inventoryTurnover;
                          return (
                            <td key={x} className={[v === undefined ? "" : v >= 0 ? styles.heatPos : styles.heatNeg, isBase ? styles.heatBase : ""].join(" ")}>
                              {v === undefined ? "—" : moneyCompact(v)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className={styles.caption}>Verde: VPN positivo · rojo: VPN negativo · borde: caso base cuando coincide con la cuadrícula</p>
            </>
          )}
        </QueryState>
      </Card>
    </div>
  );
};
