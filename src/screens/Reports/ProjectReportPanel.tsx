import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataTable, ErrorState, Field, Loading, Select, type Column } from "@/components/ui";
import { useProject, useProjects, useSimulatorDefaults } from "@/hooks/financial";
import { dateOnly, int, money, moneyCompact, pct, times, todayIso, years } from "@/lib/format";
import { downloadXlsx } from "@/lib/xlsx";
import { DonutChart, HBarChart, LineChart, StackedBarChart, TornadoChart, VBarChart } from "@/components/charts";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { ratesNote } from "@/screens/Finance/ratesNote";
import { EXAMPLE_PROJECT, EXAMPLE_PROJECT_NAME, fileBase } from "@/screens/Finance/simShared";
import type { ExportData, SimulatorCalculation } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper, type Indicator } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import { coverParams, projectSections, projectSheets, projectVerdict, type Pair, type TextTableData } from "./projectReport";
import { ProjectFlowDiagram } from "./ProjectFlowDiagram";
import styles from "./ReportsScreen.module.css";

const pairColumns: Column<Pair>[] = [
  { key: "k", header: "Concepto", render: (p) => p[0] },
  { key: "v", header: "Valor", align: "right", render: (p) => p[1] },
];
const PairTable = ({ rows }: { rows: Pair[] }) => <DataTable columns={pairColumns} rows={rows} rowKey={(p) => p[0]} />;

/** Tabla de texto ya formateado (encabezados + celdas), con una nota «Fuente» opcional debajo. */
const TextTable = ({ title, data }: { title?: string; data: TextTableData }) => (
  <div className={styles.subTable}>
    {title ? <h5 className={styles.subTableTitle}>{title}</h5> : null}
    <DataTable
      columns={data.headers.map((h, i) => ({ key: String(i), header: h, align: i === 0 ? ("left" as const) : ("right" as const), render: (r: string[]) => r[i] ?? "" }))}
      rows={data.rows}
      rowKey={(r) => r.join("|")}
      scroll
    />
    {data.note ? <p className={styles.chartNote}>{data.note}</p> : null}
  </div>
);

/** Gráfico del informe con su título y la nota «Fuente» que dice de qué tabla sale (trazabilidad). */
const Figure = ({ title, source, children }: { title: string; source: string; children: ReactNode }) => (
  <figure className={styles.figure}>
    <h5 className={styles.subTableTitle}>{title}</h5>
    {children}
    <figcaption className={styles.chartNote}>Fuente: {source}</figcaption>
  </figure>
);

/** Qué escenario se muestra: un proyecto guardado (por id) o el ejemplo de la ampliación de la API. */
type Choice = typeof EXAMPLE_PROJECT | number;
const parseChoice = (raw: string | undefined): Choice | null => {
  if (raw === EXAMPLE_PROJECT) return EXAMPLE_PROJECT;
  const n = Number(raw);
  return raw !== undefined && Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * Informe del proyecto (documento S-01): se elige un escenario guardado del simulador y se genera el informe con sus seis
 * secciones (resumen y supuestos; mercado y competencia; costos e inversión; financiación y amortización; flujo de caja e
 * indicadores; riesgos y escenarios). Las cifras son las que recalcula la API para ese proyecto: las mismas de Finanzas.
 * Comparte con los otros reportes la vista previa, la portada con folio y QR y el pie «Página X de Y».
 */
export const ProjectReportPanel = ({ initial }: { initial?: string | undefined }) => {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  const projects = useProjects("all", { limit: 50 });
  const [picked, setPicked] = useState<Choice | null>(() => parseChoice(initial));
  const items = projects.data?.items ?? [];
  // Sin elección válida: el primer proyecto guardado y, si no hay ninguno, el ejemplo.
  const choice: Choice | null = useMemo(() => {
    if (picked !== null && (picked === EXAMPLE_PROJECT || items.some((p) => p.id === picked))) return picked;
    if (!projects.data) return null;
    return items[0]?.id ?? EXAMPLE_PROJECT;
  }, [picked, items, projects.data]);
  const projectId = typeof choice === "number" ? choice : null;
  const project = useProject(projectId);
  const example = useSimulatorDefaults(choice === EXAMPLE_PROJECT);
  const calc: SimulatorCalculation | undefined = projectId !== null ? project.data : choice === EXAMPLE_PROJECT ? example.data : undefined;
  const name = projectId !== null ? (project.data?.name ?? "") : EXAMPLE_PROJECT_NAME;
  const generated = user ? `Generado por ${user.firstName} ${user.lastName}, ${ROLE_LABELS[user.role]}, el ${dateOnly(todayIso())}` : `Generado el ${dateOnly(todayIso())}`;

  const filters = (
    <div className={styles.filterGroup}>
      <div className={styles.scenarioField}>
        <Field label="Escenario" htmlFor="project-report-choice" hint={items.length === 0 && projects.data ? "Sin proyectos guardados: en Finanzas, «Guardar como» crea el primero." : undefined}>
          <Select id="project-report-choice" value={choice === null ? "" : String(choice)} onChange={(e) => setPicked(parseChoice(e.target.value))} disabled={projects.isPending}>
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.username} · VPN {moneyCompact(p.indicators.npv)}
              </option>
            ))}
            <option value={EXAMPLE_PROJECT}>{EXAMPLE_PROJECT_NAME} (cifras de ejemplo)</option>
          </Select>
        </Field>
      </div>
      <Button variant="ghost" size="sm" onClick={() => navigate({ pathname: "/finanzas/mercado", search: projectId !== null ? `?proyecto=${projectId}` : "" })}>
        Abrir en el simulador
      </Button>
    </div>
  );

  const body = () => {
    if (projects.isError) return <ErrorState error={projects.error} onRetry={() => projects.refetch()} />;
    if (projectId !== null && project.isError) return <ErrorState error={project.error} onRetry={() => project.refetch()} />;
    if (choice === EXAMPLE_PROJECT && example.isError) return <ErrorState error={example.error} onRetry={() => example.refetch()} />;
    if (!calc) return <Loading text="Generando el informe…" />;
    const { input, result } = calc;
    const s = projectSections(input, result);
    const ind = result.indicators;
    const good = ind.npv >= 0;
    const notes = ratesNote(result);
    const ledger: Indicator[] = [
      { label: "VPN del proyecto", value: money(ind.npv), tone: good ? "good" : "bad" },
      { label: "TIR", value: pct(ind.irr) },
      { label: "Recuperación", value: years(ind.paybackSimple) },
      { label: "Beneficio / costo", value: times(ind.benefitCostRatio) },
      { label: "Cuota mensual", value: money(result.financing.installment) },
      { label: "Cobertura mínima", value: result.financing.minCoverage === null ? "sin cuota" : times(result.financing.minCoverage), ...(result.financing.coverageAlert ? { tone: "bad" as const } : {}) },
    ];
    return (
      <ReportPaper
        code="S-01"
        title="Informe del proyecto ·"
        accent={name}
        meta={[projectId === null ? "Ampliación del local · cifras de ejemplo, no del negocio real" : `Proyecto guardado en el simulador por ${project.data?.username ?? ""}`, generated]}
        summary={
          <>
            <p>
              <strong>{projectVerdict(result)}</strong> Inversión de {money(result.investment.total)}, {pct(input.financing.creditPct)} con crédito a {int(input.financing.termMonths)} meses; precio de{" "}
              {money(result.costs.price)} y {int(result.competition.annualUnits)} unidades el primer año.
            </p>
            {notes.map((n) => (
              <p key={n.slice(0, 24)}>{n}</p>
            ))}
          </>
        }
        params={s.assumptions.map(([label, value]) => ({ label, value }))}
        indicators={ledger}
        note="Cifras calculadas por el servidor con los supuestos del proyecto; son las mismas de la pantalla de Finanzas. Es un apoyo para decidir, no un concepto financiero."
      >
        <PaperBlock label="Flujo económico del proyecto" hint="de la demanda a los indicadores · cada paso remite a su sección">
          <ProjectFlowDiagram input={input} result={result} />
        </PaperBlock>
        <PaperBlock label="1. Resumen y supuestos">
          <PairTable rows={[...s.indicators, ...s.assumptions]} />
        </PaperBlock>
        <PaperBlock label="2. Mercado y competencia">
          <Figure title="Demanda del mercado por año" source={`tabla de mercado de esta sección: demanda anual que crece ${pct(result.market.growth)} al año (PIB y desempleo).`}>
            <VBarChart data={result.market.years.map((y) => ({ label: `Año ${y.year}`, value: y.demand }))} format={(v) => int(v)} title="Demanda del mercado en unidades por año" />
          </Figure>
          <PairTable rows={s.market} />
          <Figure title="Cuota que aporta cada competidor" source={`tabla «Competidores», columna «Aporte»: suma ${pct(result.competition.marketShare)} del mercado, ${int(result.competition.annualUnits)} unidades al año.`}>
            <HBarChart data={result.competition.competitors.map((c) => ({ label: c.name, value: c.contribution }))} format={pct} title="Aporte de cada competidor a la cuota captada" />
          </Figure>
          <TextTable title="Competidores" data={s.competitors} />
        </PaperBlock>
        <PaperBlock label="3. Costos e inversión">
          <Figure title="Costos fijos y variables por año" source="tabla «Costos por unidades vendidas», filas «Costos fijos» y «Costos variables»; la barra completa es el costo total.">
            <StackedBarChart
              data={result.costs.years.map((y) => ({ label: `Año ${y.year}`, values: { fixed: y.fixedTotal, variable: y.variableTotal } }))}
              series={[
                { key: "fixed", label: "Costos fijos", tone: "forest" },
                { key: "variable", label: "Costos variables", tone: "soft" },
              ]}
              format={moneyCompact}
              formatTip={money}
              title="Costos fijos y variables por año"
            />
          </Figure>
          <TextTable title="Costos por unidades vendidas" data={s.costs} />
          <Figure title="Composición de la inversión inicial" source="tabla «Inversión inicial», columnas «Valor» y «Parte».">
            <DonutChart
              data={result.investment.items.map((i, k) => ({ label: i.label, value: i.amount, tone: (["accent", "good", "warn", "muted"] as const)[k % 4] ?? "muted" }))}
              format={money}
              center={moneyCompact(result.investment.total)}
              centerLabel="inversión total"
              title="Composición de la inversión inicial"
            />
          </Figure>
          <TextTable title="Inversión inicial" data={s.investment} />
          <Figure title="Depreciación y amortización por año" source="tablas «Depreciación de activos fijos» y «Amortización de diferidos»; la barra completa es el cargo anual que baja el impuesto.">
            <StackedBarChart
              data={result.investment.schedule.map((d) => ({ label: `Año ${d.year}`, values: { dep: d.depreciation, amort: d.amortization } }))}
              series={[
                { key: "dep", label: "Depreciación", tone: "forest" },
                { key: "amort", label: "Amortización de diferidos", tone: "warn" },
              ]}
              format={moneyCompact}
              formatTip={money}
              title="Depreciación y amortización por año"
            />
          </Figure>
          <TextTable title="Depreciación de activos fijos" data={s.depreciation} />
          <TextTable title="Amortización de diferidos" data={s.amortization} />
          <p className={styles.chartNote}>{s.chargeNote}</p>
        </PaperBlock>
        <PaperBlock label="4. Financiación y amortización">
          <Figure title="Cómo se financia la inversión" source="resumen de financiación de esta sección: crédito y aporte propio.">
            <DonutChart
              data={[
                { label: "Crédito", value: result.financing.credit, tone: "warn" },
                { label: "Aporte propio", value: result.financing.ownContribution, tone: "accent" },
              ]}
              format={money}
              center={pct(result.financing.debtRatio)}
              centerLabel="con crédito"
              title="Crédito y aporte propio"
            />
          </Figure>
          <PairTable rows={s.financingSummary} />
          {result.financing.annual.length > 0 ? (
            <Figure title="Intereses y abono a capital por año" source="tabla «Resumen anual del crédito», columnas «Intereses» y «Abono a capital»; la barra completa son las cuotas del año.">
              <StackedBarChart
                data={result.financing.annual.map((a) => ({ label: `Año ${a.year}`, values: { interest: a.interest, principal: a.principal } }))}
                series={[
                  { key: "interest", label: "Intereses", tone: "warn" },
                  { key: "principal", label: "Abono a capital", tone: "forest" },
                ]}
                format={moneyCompact}
                formatTip={money}
                title="Intereses y abono a capital por año"
              />
            </Figure>
          ) : null}
          <TextTable title="Resumen anual del crédito" data={s.annual} />
          {result.financing.monthly.length > 0 ? (
            <Figure title="Saldo del crédito mes a mes" source="tabla de amortización mensual, columna «Saldo».">
              <LineChart points={result.financing.monthly.map((x) => ({ x: x.month, y: x.balance }))} formatX={(m) => `Mes ${int(m)}`} formatY={moneyCompact} title="Saldo del crédito mes a mes" />
            </Figure>
          ) : null}
          <TextTable title="Tabla de amortización del crédito (mensual)" data={s.monthly} />
        </PaperBlock>
        <PaperBlock label="5. Flujo de caja e indicadores">
          <Figure title="De los ingresos al EBITDA" source="tabla de flujo de caja: la barra completa son los ingresos de cada año (unidades × precio), repartidos en costos variables, costos fijos y EBITDA.">
            <StackedBarChart
              data={result.cashFlow.years.map((y) => ({ label: `Año ${y.year}`, values: { variable: y.variableCosts, fixed: y.fixedCosts, ebitda: Math.max(y.ebitda, 0) } }))}
              series={[
                { key: "variable", label: "Costos variables", tone: "soft" },
                { key: "fixed", label: "Costos fijos", tone: "muted" },
                { key: "ebitda", label: "EBITDA", tone: "good" },
              ]}
              format={moneyCompact}
              formatTip={money}
              title="Ingresos repartidos en costos y EBITDA por año"
            />
          </Figure>
          <Figure title="Flujo neto por año" source={`fila «Flujo neto» de la tabla de flujo de caja; en naranja, los años con salida neta (el año 0 es la inversión). Recuperación: ${years(ind.paybackSimple)}.`}>
            <VBarChart data={result.cashFlow.flows.map((f, i) => ({ label: `Año ${i}`, value: f, alt: f < 0 }))} format={moneyCompact} formatTip={money} title="Flujo neto del proyecto por año" />
          </Figure>
          <TextTable data={s.flow} />
          <PairTable rows={s.indicators} />
        </PaperBlock>
        <PaperBlock label="6. Riesgos y escenarios">
          <Figure title="Tornado: sensibilidad del VPN" source={`tabla «Tornado»: cada variable se mueve por separado y las demás quedan fijas. VPN base ${money(result.risks.baseNpv)}.`}>
            <TornadoChart data={result.risks.tornado.map((t) => ({ label: `${t.label} ${t.change}`, low: t.npvLow, high: t.npvHigh }))} base={result.risks.baseNpv} format={moneyCompact} />
          </Figure>
          <TextTable title="Tornado" data={s.tornado} />
          <Figure title="VPN por escenario" source="tabla «Escenarios pesimista, base y optimista», columna «VPN»; en naranja, los escenarios con VPN negativo.">
            <VBarChart data={result.scenarios.map((x) => ({ label: x.label, value: x.npv, alt: x.npv < 0 }))} format={moneyCompact} formatTip={money} title="VPN por escenario" />
          </Figure>
          <TextTable title="Escenarios pesimista, base y optimista" data={s.scenarios} />
        </PaperBlock>
      </ReportPaper>
    );
  };

  const record = calc
    ? {
        report: "scenario" as const,
        description: `Informe del proyecto · ${name}`.slice(0, 200),
        filters: { projectId, proyecto: name.slice(0, 160) } as ExportData,
        summary: {
          npv: calc.result.indicators.npv,
          irr: calc.result.indicators.irr,
          paybackSimple: calc.result.indicators.paybackSimple,
          benefitCostRatio: calc.result.indicators.benefitCostRatio,
          price: calc.result.costs.price,
          growth: calc.result.market.growth,
        } as ExportData,
      }
    : undefined;

  const exportExcel = async () => {
    if (!calc) return false;
    const s = projectSections(calc.input, calc.result);
    return downloadXlsx(`${fileBase(name)}.xlsx`, projectSheets(s, ratesNote(calc.result), [`Agropecuaria Mi Tierrita · Informe del proyecto: ${name}`, projectVerdict(calc.result), generated]));
  };

  return (
    <ReportPreview
      subtitle={`Informe del proyecto · ${name || "…"} · seis secciones en el orden de las pestañas del simulador · generado el ${dateOnly(todayIso())}`}
      filters={filters}
      exportName={calc ? fileBase(name) : undefined}
      onExcel={calc ? exportExcel : undefined}
      record={record}
      cover={calc ? { code: "S-01", title: "Informe del", accent: "proyecto", period: `${name} · ${projectVerdict(calc.result)}`, params: coverParams(calc.input, calc.result) } : undefined}
    >
      {body()}
    </ReportPreview>
  );
};
