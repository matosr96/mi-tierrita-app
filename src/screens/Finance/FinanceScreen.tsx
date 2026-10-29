import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProject, useSaveProject, useSimulation, useSimulatorDefaults } from "@/hooks/financial";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, Callout, ErrorState, Loading, Tabs } from "@/components/ui";
import { dateTime, money, moneyCompact, pct, times, years } from "@/lib/format";
import { fieldErrors } from "@/lib/errors";
import { useSessionStore } from "@/stores/session";
import type { SimulatorInput, SimulatorResult } from "@/types/api";
import { MarketTab } from "./MarketTab";
import { CompetitionTab } from "./CompetitionTab";
import { CostsTab } from "./CostsTab";
import { InvestmentTab } from "./InvestmentTab";
import { FinancingTab } from "./FinancingTab";
import { CashFlowTab } from "./CashFlowTab";
import { RisksTab } from "./RisksTab";
import { ProjectsTab } from "./ProjectsTab";
import { SaveAsModal } from "./SaveAsModal";
import { SimulatorReport } from "./SimulatorReport";
import { SIM_TABS, isSimTab, type SimTab, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

const EXAMPLE_NAME = "Ampliación del local (ejemplo)";

/** Espera a que se deje de escribir antes de pedir el recálculo a la API. */
const useDebounced = <T,>(value: T, ms: number): T => {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setCurrent(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return current;
};

type Draft = { source: string; input: SimulatorInput };
type Tone = "good" | "bad" | "warn" | undefined;
const toneClass = (t: Tone): string => (t === "good" ? styles.tickGood : t === "bad" ? styles.tickBad : t === "warn" ? styles.tickWarn : "") ?? "";

/**
 * Simulador financiero (Fase B): siete secciones en cadena más Escenarios. La pantalla solo edita supuestos; cada
 * cambio se envía a `POST /financial/simulator/calculate` y se muestra lo que responde la API (una sola fuente).
 * `?proyecto=<id>` abre un proyecto guardado; sin él se parte del ejemplo de $94,5 M. Solo ADMIN (la ruta ya lo garantiza).
 */
export const FinanceScreen = () => {
  const { tab: tabParam } = useParams();
  const tab: SimTab = isSimTab(tabParam) ? tabParam : "mercado";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = useSessionStore((s) => s.user?.id);
  const rawId = Number(searchParams.get("proyecto"));
  const projectId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;

  const project = useProject(projectId);
  const defaults = useSimulatorDefaults(projectId === null);
  const source = projectId === null ? defaults.data : project.data;
  const sourceKey = projectId === null ? (defaults.data ? "ejemplo" : null) : project.data ? `p${project.data.id}:${project.data.updatedAt}` : null;

  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => {
    if (source && sourceKey !== null && draft?.source !== sourceKey) setDraft({ source: sourceKey, input: source.input });
  }, [source, sourceKey, draft?.source]);

  const liveInput = draft && draft.source === sourceKey ? draft.input : null;
  const debounced = useDebounced(liveInput, 300);
  const simulation = useSimulation(debounced);
  const save = useSaveProject();
  const [saveAs, setSaveAs] = useState(false);

  const savedInput = source?.input;
  const dirty = useMemo(() => liveInput !== null && savedInput !== undefined && JSON.stringify(liveInput) !== JSON.stringify(savedInput), [liveInput, savedInput]);
  // Lo que se muestra: el último cálculo de la API para lo escrito, o el del proyecto o el ejemplo mientras llega.
  const result: SimulatorResult | undefined = simulation.data?.result ?? source?.result;
  const errors = simulation.error ? fieldErrors(simulation.error) : {};
  const recalculating = simulation.isFetching || (liveInput !== null && debounced !== liveInput);

  const name = projectId !== null && project.data ? project.data.name : EXAMPLE_NAME;
  const own = projectId !== null && project.data?.userId === userId;

  const goTab = (t: SimTab) => navigate({ pathname: `/finanzas/${t}`, search: searchParams.toString() });
  const openProject = (id: number) => navigate({ pathname: "/finanzas/mercado", search: `?proyecto=${id}` });
  const startFromExample = () => navigate({ pathname: `/finanzas/${tab === "escenarios" ? "mercado" : tab}`, search: "" });

  const meta = SIM_TABS.find((t) => t.value === tab)!;

  const actions =
    liveInput && result ? (
      <>
        <SimulatorReport name={name} projectId={projectId} input={liveInput} result={result} />
        {own ? (
          <Button variant="secondary" onClick={() => save.mutate({ id: projectId!, input: liveInput })} loading={save.isPending} disabled={!dirty}>
            Guardar proyecto
          </Button>
        ) : null}
        <Button onClick={() => setSaveAs(true)}>Guardar como</Button>
      </>
    ) : null;

  const ticker = () => {
    if (!result) return null;
    const ind = result.indicators;
    const cov = result.financing.minCoverage;
    const cells: { label: string; value: string; tone?: Tone }[] = [
      { label: "VPN del proyecto", value: moneyCompact(ind.npv), tone: ind.npv < 0 ? "bad" : "good" },
      { label: "TIR", value: pct(ind.irr), tone: ind.irr !== null && ind.irr < ind.discountRate ? "bad" : undefined },
      { label: "Recuperación", value: years(ind.paybackSimple) },
      { label: "Beneficio / costo", value: times(ind.benefitCostRatio), tone: ind.benefitCostRatio < 1 ? "bad" : undefined },
      { label: "Precio de venta", value: money(result.costs.price) },
      { label: "Cobertura mínima", value: cov === null ? "Sin cuota" : times(cov), tone: cov !== null && cov < 1 ? "bad" : undefined },
    ];
    return (
      <dl className={styles.ticker} aria-label="Indicadores calculados por la API" aria-busy={recalculating}>
        {cells.map((c) => (
          <div key={c.label} className={styles.tick}>
            <dt>{c.label}</dt>
            <dd className={toneClass(c.tone)}>{c.value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const body = () => {
    if (tab === "escenarios") return <ProjectsTab currentId={projectId} onOpen={openProject} onClosed={() => navigate({ pathname: "/finanzas/escenarios", search: "" })} />;
    const pending = projectId === null ? defaults.isPending : project.isPending;
    const failed = projectId === null ? defaults.isError : project.isError;
    if (failed) {
      const err = projectId === null ? defaults.error : project.error;
      return (
        <div className={styles.stack}>
          <ErrorState error={err} onRetry={() => (projectId === null ? defaults.refetch() : project.refetch())} />
          {projectId !== null ? (
            <div>
              <Button variant="secondary" onClick={startFromExample}>
                Volver al ejemplo
              </Button>
            </div>
          ) : null}
        </div>
      );
    }
    if (pending || !liveInput || !result) return <Loading text="Cargando el simulador…" />;
    const props: TabProps = { input: liveInput, result, errors, onChange: (next) => setDraft({ source: sourceKey!, input: next }) };
    switch (tab) {
      case "mercado":
        return <MarketTab {...props} />;
      case "competencia":
        return <CompetitionTab {...props} />;
      case "costos":
        return <CostsTab {...props} />;
      case "inversion":
        return <InvestmentTab {...props} />;
      case "financiacion":
        return <FinancingTab {...props} />;
      case "flujo":
        return <CashFlowTab {...props} />;
      case "riesgos":
        return <RisksTab {...props} name={name} projectId={projectId} />;
    }
  };

  const status = () => {
    if (projectId === null) return `Ejemplo de la ampliación · cifras de ejemplo, no del negocio real${dirty ? " · con cambios sin guardar" : ""}`;
    if (!project.data) return "Abriendo el proyecto…";
    const who = own ? "Su proyecto" : `Proyecto de ${project.data.username} (puede «Guardar como»)`;
    return `${who} · guardado el ${dateTime(project.data.updatedAt)}${dirty ? " · con cambios sin guardar" : ""}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <PageHeader title={tab === "escenarios" ? "Escenarios y proyectos" : name} subtitle={tab === "escenarios" ? meta.question : `${meta.label}: ${meta.question}`} actions={tab === "escenarios" ? null : actions} />
        <div className={styles.statusRow}>
          <span>{status()}</span>
          {recalculating ? <span className={styles.recalc}>Recalculando…</span> : null}
          {projectId !== null ? (
            <Button variant="ghost" size="sm" onClick={startFromExample}>
              Empezar desde el ejemplo
            </Button>
          ) : null}
        </div>
        {tab === "escenarios" ? null : ticker()}
        <div className={styles.tabsOnBand}>
          <Tabs options={SIM_TABS.map((t) => ({ value: t.value, label: t.label }))} value={tab} onChange={goTab} ariaLabel="Secciones del simulador" />
        </div>
      </header>

      {Object.keys(errors).length > 0 ? (
        <Callout tone="warn" title="Revise los datos marcados">
          La API no recalculó con estos valores; las cifras en pantalla son las del último cálculo válido.
        </Callout>
      ) : simulation.error ? (
        <Callout tone="bad" title="No se pudo recalcular">
          {simulation.error.message}
        </Callout>
      ) : null}

      {body()}
      {saveAs && liveInput ? (
        <SaveAsModal
          initialName={projectId === null ? "Ampliación del local" : `${name} (copia)`}
          input={liveInput}
          onClose={() => setSaveAs(false)}
          onSaved={(id) => {
            setSaveAs(false);
            navigate({ pathname: `/finanzas/${tab}`, search: `?proyecto=${id}` });
          }}
        />
      ) : null}
    </div>
  );
};
