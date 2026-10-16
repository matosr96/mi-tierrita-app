import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useScenario, useScenarios } from "@/hooks/financial";
import type { ScenarioDetail } from "@/types/api";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, EmptyState, ErrorState, Loading, QueryState, Tabs, type TabOption } from "@/components/ui";
import { dateOnly, money, moneyCompact, pct, times } from "@/lib/format";
import { DecisionPanel } from "./DecisionPanel";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ScenariosPanel } from "./ScenariosPanel";
import { ScenarioExport } from "./ScenarioExport";
import { CashFlowPanel } from "./CashFlowPanel";
import { ScenarioFormModal } from "./ScenarioFormModal";
import { letterOf } from "./financeShared";
import styles from "./FinanceScreen.module.css";

export type FinanceTab = "panel" | "supuestos" | "escenarios" | "flujo";

const TAB_OPTIONS: TabOption<FinanceTab>[] = [
  { value: "panel", label: "Panel" },
  { value: "supuestos", label: "Datos y supuestos" },
  { value: "escenarios", label: "Escenarios" },
  { value: "flujo", label: "Flujo y amortización" },
];

/** Título y subtítulo de cada vista (el Panel usa el nombre del escenario). */
const TAB_META: Record<Exclude<FinanceTab, "panel">, { title: string; subtitle: string }> = {
  supuestos: { title: "Datos del caso y supuestos", subtitle: "Cada campo indica su origen. Un cambio recalcula todos los indicadores y queda registrado con su usuario." },
  escenarios: { title: "Escenarios y sensibilidad", subtitle: "Qué alternativa conviene y cuánto margen de error tolera antes de dejar de convenir." },
  flujo: { title: "Flujo de caja y amortización", subtitle: "Detalle año por año de la ampliación y mes por mes del crédito." },
};

const isTab = (v: string | undefined): v is FinanceTab => v === "panel" || v === "supuestos" || v === "escenarios" || v === "flujo";

type Tone = "good" | "bad" | "warn" | undefined;
const toneClass = (t: Tone): string => (t === "good" ? styles.tickGood : t === "bad" ? styles.tickBad : t === "warn" ? styles.tickWarn : "") ?? "";

/** CU-14 a CU-17: evaluación de la ampliación con crédito. Solo ADMIN (la ruta ya lo garantiza). */
export const FinanceScreen = () => {
  const { tab: tabParam } = useParams();
  const tab: FinanceTab = isTab(tabParam) ? tabParam : "panel";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const scenarios = useScenarios();
  const items = useMemo(() => [...(scenarios.data?.items ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [scenarios.data]);

  const paramId = Number(searchParams.get("escenario"));
  const selectedId = items.some((s) => s.id === paramId) ? paramId : (items[0]?.id ?? null);
  const selected = items.find((s) => s.id === selectedId);
  const detail = useScenario(selectedId);

  const [modal, setModal] = useState<{ open: boolean; prefill: ScenarioDetail | null }>({ open: false, prefill: null });
  const openNew = () => setModal({ open: true, prefill: null });
  const openDuplicate = () => setModal({ open: true, prefill: detail.data ?? null });
  const closeModal = () => setModal({ open: false, prefill: null });

  const goTab = (t: FinanceTab) => navigate({ pathname: t === "panel" ? "/finanzas" : `/finanzas/${t}`, search: searchParams.toString() });
  const selectScenario = (id: number) => setSearchParams({ escenario: String(id) });
  const onCreated = (id: number) => {
    closeModal();
    setSearchParams({ escenario: String(id) });
  };

  // Orden de creación: la letra de cada escenario (A, B, C…) coincide con la de la comparación.
  const presets = useMemo(() => [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [items]);
  const selectedLetter = selected ? letterOf(Math.max(0, presets.findIndex((s) => s.id === selected.id))) : null;

  const actions = () => {
    if (!selected) return null;
    const exportButtons = detail.data ? <ScenarioExport scenario={detail.data} letter={selectedLetter ?? "A"} /> : null;
    if (tab === "panel" || tab === "flujo") return exportButtons;
    if (tab === "supuestos" || tab === "escenarios") {
      return (
        <>
          {exportButtons}
          <Button variant="secondary" onClick={openDuplicate} disabled={!detail.data}>
            {tab === "supuestos" ? "Nuevo escenario a partir de este" : "Duplicar escenario"}
          </Button>
          <Button onClick={openNew}>Nuevo escenario</Button>
        </>
      );
    }
    return null;
  };

  const ticker = () => {
    const ind = detail.data?.indicators;
    if (!ind || !detail.data) return null;
    const cov = ind.coverageIncremental;
    const cells: { label: string; value: string; tone?: Tone }[] = [
      { label: "VPN del proyecto", value: moneyCompact(ind.npv), tone: ind.npv < 0 ? "bad" : "good" },
      { label: "TIR", value: pct(ind.irr), tone: ind.irr !== null && ind.npv < 0 ? "bad" : undefined },
      { label: "VPN inversionista", value: moneyCompact(ind.investorNpv), tone: ind.investorNpv < 0 ? "bad" : undefined },
      { label: "Cobertura", value: times(cov), tone: cov === null ? undefined : cov < 1 ? "bad" : cov < 1.5 ? "warn" : undefined },
      { label: "Cuota mensual", value: moneyCompact(ind.installment) },
      { label: "Aporte propio", value: money(ind.ownContribution) },
    ];
    return (
      <dl className={styles.ticker} aria-label="Indicadores del escenario calculados por la API">
        {cells.map((c) => (
          <div key={c.label} className={styles.tick}>
            <dt>{c.label}</dt>
            <dd className={toneClass(c.tone)}>{c.value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const meta = tab === "panel" ? null : TAB_META[tab];
  const heading = selected ? (tab === "panel" ? selected.name : (meta?.title ?? "")) : "Finanzas y crédito";
  const subtitle = selected
    ? tab === "panel"
      ? `Ampliación del local con crédito bancario · Escenario ${selectedLetter ?? "A"} · ${selected.username} · ${dateOnly(selected.createdAt)}`
      : (meta?.subtitle ?? "")
    : "Ampliación del local con crédito bancario";

  const body = () => {
    if (scenarios.isPending) return <Loading text="Cargando escenarios…" />;
    if (scenarios.isError) return <ErrorState error={scenarios.error} onRetry={() => scenarios.refetch()} />;
    if (items.length === 0 || selectedId === null) {
      return (
        <EmptyState
          title="Todavía no hay escenarios"
          text="Cree el primer escenario con la inversión, el crédito y el aumento de ventas esperado. La API calcula todos los indicadores."
          action={<Button onClick={openNew}>Nuevo escenario</Button>}
        />
      );
    }
    return (
      <QueryState query={detail} empty={null}>
        {(scenario) => {
          switch (tab) {
            case "panel":
              return <DecisionPanel scenario={scenario} onOpenAssumptions={() => goTab("supuestos")} onNew={openNew} />;
            case "supuestos":
              return <AssumptionsPanel scenario={scenario} letter={selectedLetter ?? "A"} />;
            case "escenarios":
              return <ScenariosPanel scenario={scenario} scenarios={items} onSelect={selectScenario} />;
            case "flujo":
              return <CashFlowPanel scenario={scenario} />;
          }
        }}
      </QueryState>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <PageHeader title={heading} subtitle={subtitle} actions={actions()} />

        {presets.length > 0 && selectedId !== null ? (
          <div className={styles.selector} role="group" aria-label="Escenario en pantalla">
            <span className={styles.selectorLabel}>Escenario</span>
            <div className={styles.selectorList}>
              {presets.map((s, i) => {
                const on = s.id === selectedId;
                return (
                  <button key={s.id} type="button" aria-pressed={on} title={s.name} className={[styles.selectorItem, on ? styles.selectorOn : ""].join(" ")} onClick={() => selectScenario(s.id)}>
                    <span className={styles.selectorLetter}>{letterOf(i)}</span>
                    <span className={styles.selectorName}>{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "panel" ? null : ticker()}

        <div className={styles.tabsOnBand}>
          <Tabs options={TAB_OPTIONS} value={tab} onChange={goTab} ariaLabel="Vistas de la evaluación" />
        </div>
      </header>

      {body()}
      {modal.open ? <ScenarioFormModal prefill={modal.prefill} onClose={closeModal} onCreated={onCreated} /> : null}
    </div>
  );
};
