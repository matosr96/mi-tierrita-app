import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, DataTable, ErrorState, Field, Loading, Select, type Column } from "@/components/ui";
import { useProject, useProjects, useSimulatorDefaults } from "@/hooks/financial";
import { dateOnly, int, money, moneyCompact, pct, times, todayIso, years } from "@/lib/format";
import { downloadXlsx } from "@/lib/xlsx";
import { ROLE_LABELS, useSessionStore } from "@/stores/session";
import { ratesNote } from "@/screens/Finance/ratesNote";
import { EXAMPLE_PROJECT, EXAMPLE_PROJECT_NAME, fileBase } from "@/screens/Finance/simShared";
import type { ExportData, SimulatorCalculation } from "@/types/api";
import { ReportPreview } from "./ReportPreview";
import { ReportPaper, type Indicator } from "./ReportPaper";
import { PaperBlock } from "./PaperBlock";
import { coverParams, projectSections, projectSheets, projectVerdict, type Pair, type TextTableData } from "./projectReport";
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
        <PaperBlock label="1. Resumen y supuestos">
          <PairTable rows={[...s.indicators, ...s.assumptions]} />
        </PaperBlock>
        <PaperBlock label="2. Mercado y competencia">
          <PairTable rows={s.market} />
          <TextTable title="Competidores" data={s.competitors} />
        </PaperBlock>
        <PaperBlock label="3. Costos e inversión">
          <TextTable title="Costos por unidades vendidas" data={s.costs} />
          <TextTable title="Inversión inicial" data={s.investment} />
          <TextTable title="Depreciación de activos fijos" data={s.depreciation} />
          <TextTable title="Amortización de diferidos" data={s.amortization} />
          <p className={styles.chartNote}>{s.chargeNote}</p>
        </PaperBlock>
        <PaperBlock label="4. Financiación y amortización">
          <PairTable rows={s.financingSummary} />
          <TextTable title="Resumen anual del crédito" data={s.annual} />
          <TextTable title="Tabla de amortización del crédito (mensual)" data={s.monthly} />
        </PaperBlock>
        <PaperBlock label="5. Flujo de caja e indicadores">
          <TextTable data={s.flow} />
          <PairTable rows={s.indicators} />
        </PaperBlock>
        <PaperBlock label="6. Riesgos y escenarios">
          <TextTable title="Tornado" data={s.tornado} />
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
