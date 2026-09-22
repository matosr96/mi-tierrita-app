import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useScenario, useScenarios } from "@/hooks/financial";
import type { ScenarioDetail } from "@/types/api";
import { Button, EmptyState, ErrorState, Loading, QueryState, Tabs, type TabOption } from "@/components/ui";
import { DecisionPanel } from "./DecisionPanel";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ScenariosPanel } from "./ScenariosPanel";
import { CashFlowPanel } from "./CashFlowPanel";
import { ScenarioFormModal } from "./ScenarioFormModal";
import styles from "./FinanceScreen.module.css";

export type FinanceTab = "panel" | "supuestos" | "escenarios" | "flujo";

const TAB_OPTIONS: TabOption<FinanceTab>[] = [
  { value: "panel", label: "Panel" },
  { value: "supuestos", label: "Datos y supuestos" },
  { value: "escenarios", label: "Escenarios" },
  { value: "flujo", label: "Flujo y amortización" },
];

/** Título y subtítulo de cada vista del lienzo (el Panel usa el nombre del escenario). */
const TAB_META: Record<Exclude<FinanceTab, "panel">, { title: string; subtitle: string }> = {
  supuestos: { title: "Datos del caso y supuestos", subtitle: "Cada campo indica su origen. Un cambio recalcula todos los indicadores y queda registrado con su usuario." },
  escenarios: { title: "Escenarios y sensibilidad", subtitle: "Qué alternativa conviene y cuánto margen de error tolera antes de dejar de convenir." },
  flujo: { title: "Flujo de caja y amortización", subtitle: "Detalle año por año de la ampliación y mes por mes del crédito." },
};

const isTab = (v: string | undefined): v is FinanceTab => v === "panel" || v === "supuestos" || v === "escenarios" || v === "flujo";

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

  const presets = useMemo(() => [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((s) => ({ value: String(s.id), label: s.name })), [items]);

  const titleRow = () => {
    if (!selected) return null;
    const meta = tab === "panel" ? null : TAB_META[tab];
    const selector = (
      <div className={styles.presets}>
        <Tabs options={presets} value={String(selectedId)} onChange={(v) => selectScenario(Number(v))} />
      </div>
    );
    if (tab === "panel") {
      return (
        <div className={styles.titleRow}>
          <h1 className={styles.titlePanel}>{selected.name}</h1>
          {selector}
          <Link to="/reportes" className={styles.reportLink}>
            Reporte
          </Link>
        </div>
      );
    }
    return (
      <div className={[styles.titleRow, styles.titleRowTop].join(" ")}>
        <div className={styles.titleText}>
          <h1 className={styles.title}>{meta?.title}</h1>
          <div className={styles.subtitle}>{meta?.subtitle}</div>
        </div>
        {selector}
        {tab === "supuestos" ? (
          <>
            <Button variant="secondary" onClick={openDuplicate} disabled={!detail.data}>
              Nuevo escenario a partir de este
            </Button>
            <Button onClick={openNew}>Nuevo escenario</Button>
          </>
        ) : tab === "escenarios" ? (
          <>
            <Button variant="secondary" onClick={openDuplicate} disabled={!detail.data}>
              Duplicar escenario
            </Button>
            <Button onClick={openNew}>Nuevo escenario</Button>
          </>
        ) : null}
      </div>
    );
  };

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
      <>
        {titleRow()}
        <QueryState query={detail} empty={null}>
          {(scenario) => {
            switch (tab) {
              case "panel":
                return <DecisionPanel scenario={scenario} onOpenAssumptions={() => goTab("supuestos")} onNew={openNew} />;
              case "supuestos":
                return <AssumptionsPanel scenario={scenario} />;
              case "escenarios":
                return <ScenariosPanel scenario={scenario} scenarios={items} />;
              case "flujo":
                return <CashFlowPanel scenario={scenario} />;
            }
          }}
        </QueryState>
      </>
    );
  };

  return (
    <div className={[styles.page, tab === "panel" ? "" : styles.pageWide].join(" ")}>
      <Tabs options={TAB_OPTIONS} value={tab} onChange={goTab} />
      {body()}
      {modal.open ? <ScenarioFormModal prefill={modal.prefill} onClose={closeModal} onCreated={onCreated} /> : null}
    </div>
  );
};
