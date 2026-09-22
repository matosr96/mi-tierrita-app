import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useScenario, useScenarios } from "@/hooks/financial";
import type { ScenarioDetail } from "@/types/api";
import { PageHeader } from "@/components/layout/AppShell";
import { Button, EmptyState, ErrorState, Loading, QueryState, Select, Tabs, type TabOption } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { DecisionPanel } from "./DecisionPanel";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { ScenariosPanel } from "./ScenariosPanel";
import { CashFlowPanel } from "./CashFlowPanel";
import { ScenarioFormModal } from "./ScenarioFormModal";
import styles from "./FinanceScreen.module.css";

export type FinanceTab = "panel" | "supuestos" | "escenarios" | "flujo";

const TAB_OPTIONS: TabOption<FinanceTab>[] = [
  { value: "panel", label: "Panel de decisión" },
  { value: "supuestos", label: "Datos y supuestos" },
  { value: "escenarios", label: "Escenarios y sensibilidad" },
  { value: "flujo", label: "Flujo y amortización" },
];

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

  const emptyAction = (
    <Button onClick={openNew}>
      Nuevo escenario
    </Button>
  );

  const body = () => {
    if (scenarios.isPending) return <Loading text="Cargando escenarios…" />;
    if (scenarios.isError) return <ErrorState error={scenarios.error} onRetry={() => scenarios.refetch()} />;
    if (items.length === 0 || selectedId === null) {
      return <EmptyState title="Todavía no hay escenarios" text="Cree el primer escenario con la inversión, el crédito y el aumento de ventas esperado. La API calcula todos los indicadores." action={emptyAction} />;
    }
    return (
      <QueryState query={detail} empty={null}>
        {(scenario) => {
          switch (tab) {
            case "panel":
              return <DecisionPanel scenario={scenario} onOpenAssumptions={() => goTab("supuestos")} />;
            case "supuestos":
              return <AssumptionsPanel scenario={scenario} onDuplicate={openDuplicate} />;
            case "escenarios":
              return <ScenariosPanel scenario={scenario} scenarios={items} onNew={openNew} onDuplicate={openDuplicate} />;
            case "flujo":
              return <CashFlowPanel scenario={scenario} />;
          }
        }}
      </QueryState>
    );
  };

  return (
    <div className={styles.page}>
      <PageHeader title="Finanzas y crédito" subtitle="¿Conviene ampliar el local con crédito? Indicadores calculados por la API a partir de los supuestos de cada escenario." actions={items.length > 0 ? emptyAction : undefined} />
      <div className={styles.toolbar}>
        <Tabs options={TAB_OPTIONS} value={tab} onChange={goTab} />
        {items.length > 0 && selectedId !== null ? (
          <div className={styles.selector}>
            <Select aria-label="Escenario" value={String(selectedId)} onChange={(e) => selectScenario(Number(e.target.value))}>
              {items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {selected ? (
              <span className={styles.selectorMeta}>
                {selected.username} · {dateTime(selected.createdAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      {body()}
      {modal.open ? <ScenarioFormModal prefill={modal.prefill} onClose={closeModal} onCreated={onCreated} /> : null}
    </div>
  );
};
