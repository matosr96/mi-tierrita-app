import { useMemo, useState } from "react";
import { Button, Card, Chips, DataTable, EmptyState, Modal, QueryState, type Column } from "@/components/ui";
import { useCompareProjects, useDeleteProject, useProject, useProjects } from "@/hooks/financial";
import { dateTime, int, money, moneyCompact, pct, times, years } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import type { ProjectComparison, ProjectScope, ProjectSummary } from "@/types/api";
import { SimulatorReport } from "./SimulatorReport";
import styles from "./FinanceScreen.module.css";

const MAX_COMPARED = 4;

/** «Exportar» desde la lista: abre el proyecto en la API y ofrece el mismo informe de la pantalla. */
const ExportProjectModal = ({ projectId, onClose }: { projectId: number; onClose: () => void }) => {
  const project = useProject(projectId);
  return (
    <Modal open title="Exportar proyecto" description="El informe usa el cálculo guardado del proyecto, igual al de la pantalla." onClose={onClose}>
      <QueryState query={project} empty={null}>
        {(p) => (
          <div className={styles.stackSm}>
            <p className={styles.formula}>
              <strong>{p.name}</strong> · VPN {money(p.result.indicators.npv)} · TIR {pct(p.result.indicators.irr)}
            </p>
            <div className={styles.actionsRow}>
              <SimulatorReport name={p.name} projectId={p.id} input={p.input} result={p.result} />
            </div>
          </div>
        )}
      </QueryState>
    </Modal>
  );
};

/** `onClosed` se llama al eliminar el proyecto que está abierto: la pantalla vuelve al ejemplo. */
type Props = { currentId: number | null; onOpen: (id: number) => void; onClosed: () => void };

/** 8. Escenarios guardados: lista por usuario, abrir, comparar lado a lado y exportar cada uno. */
export const ProjectsTab = ({ currentId, onOpen, onClosed }: Props) => {
  const userId = useSessionStore((s) => s.user?.id);
  const [scope, setScope] = useState<ProjectScope>("mine");
  const projects = useProjects(scope);
  const [selected, setSelected] = useState<number[]>([]);
  const [exporting, setExporting] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ProjectSummary | null>(null);
  const remove = useDeleteProject();
  const compareIds = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);
  const compare = useCompareProjects(compareIds);

  const toggle = (id: number) => setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length >= MAX_COMPARED ? list : [...list, id]));

  const columns: Column<ProjectSummary>[] = [
    {
      key: "pick",
      header: "",
      label: "Comparar",
      width: "44px",
      render: (p) => (
        <input type="checkbox" aria-label={`Comparar ${p.name}`} checked={selected.includes(p.id)} onChange={() => toggle(p.id)} disabled={!selected.includes(p.id) && selected.length >= MAX_COMPARED} />
      ),
    },
    {
      key: "name",
      header: "Proyecto",
      render: (p) => (
        <span className={styles.projectName}>
          <strong>{p.name}</strong>
          <span className={styles.muted}>
            {p.username} · {dateTime(p.updatedAt)}
            {p.id === currentId ? " · abierto" : ""}
          </span>
        </span>
      ),
    },
    { key: "assumptions", header: "Supuestos", render: (p) => `${moneyCompact(p.highlights.totalInvestment)} · ${pct(p.highlights.creditPct)} crédito · margen ${pct(p.highlights.marginOnCost)}` },
    { key: "npv", header: "VPN", align: "right", render: (p) => <span className={p.indicators.npv < 0 ? styles.bad : styles.good}>{moneyCompact(p.indicators.npv)}</span> },
    { key: "irr", header: "TIR", align: "right", render: (p) => pct(p.indicators.irr) },
    { key: "bc", header: "B/C", align: "right", render: (p) => times(p.indicators.benefitCostRatio) },
    {
      key: "actions",
      header: "",
      label: "Acciones",
      render: (p) => (
        <div className={styles.actionsRow}>
          <Button size="sm" variant="secondary" onClick={() => onOpen(p.id)} disabled={p.id === currentId}>
            Abrir
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExporting(p.id)}>
            Exportar
          </Button>
          {p.userId === userId ? (
            <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>
              Eliminar
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const compareRows: { key: string; label: string; value: (p: ProjectComparison) => string }[] = [
    { key: "inv", label: "Inversión total", value: (p) => money(p.highlights.totalInvestment) },
    { key: "credit", label: "Parte con crédito", value: (p) => `${pct(p.highlights.creditPct)} a ${p.highlights.termMonths} meses` },
    { key: "growth", label: "Crecimiento de la demanda", value: (p) => pct(p.highlights.growth) },
    { key: "units", label: "Unidades del año 1", value: (p) => int(p.highlights.annualUnits) },
    { key: "price", label: "Precio de venta", value: (p) => money(p.highlights.price) },
    { key: "npv", label: "VPN", value: (p) => money(p.indicators.npv) },
    { key: "irr", label: "TIR", value: (p) => pct(p.indicators.irr) },
    { key: "payback", label: "Recuperación", value: (p) => years(p.indicators.paybackSimple) },
    { key: "bc", label: "Beneficio / costo", value: (p) => times(p.indicators.benefitCostRatio) },
    { key: "inst", label: "Cuota mensual", value: (p) => money(p.indicators.installment) },
    { key: "cov", label: "Cobertura mínima", value: (p) => (p.indicators.minCoverage === null ? "sin cuota" : times(p.indicators.minCoverage)) },
    { key: "pes", label: "VPN pesimista", value: (p) => money(p.scenarios.find((s) => s.key === "pessimistic")?.npv) },
    { key: "opt", label: "VPN optimista", value: (p) => money(p.scenarios.find((s) => s.key === "optimistic")?.npv) },
  ];

  return (
    <div className={styles.stack}>
      <Card
        title="Proyectos guardados"
        subtitle="Cada proyecto guarda sus supuestos; las cifras las recalcula el servidor al abrirlo. Marque de dos a cuatro para compararlos."
        actions={<Chips options={[{ value: "mine", label: "Mis proyectos" }, { value: "all", label: "De todos" }]} value={scope} onChange={setScope} />}
        flush
      >
        <QueryState
          query={projects}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState title="Todavía no hay proyectos guardados" text="Ajuste los supuestos en las pestañas y use «Guardar como» para guardar el primero." />}
        >
          {(data) => <DataTable columns={columns} rows={data.items} rowKey={(p) => p.id} scroll />}
        </QueryState>
      </Card>

      {compareIds.length >= 2 ? (
        <Card title="Comparación" subtitle="Mismo cálculo de la API para cada proyecto, con sus escenarios pesimista y optimista." flush>
          <QueryState query={compare} isEmpty={(d) => d.projects.length === 0} empty={null}>
            {(data) => (
              <DataTable
                columns={[
                  { key: "label", header: "Indicador", render: (row) => row.label },
                  ...data.projects.map((p) => ({ key: String(p.id), header: p.name, align: "right" as const, render: (row: (typeof compareRows)[number]) => row.value(p) })),
                ]}
                rows={compareRows}
                rowKey={(row) => row.key}
                scroll
              />
            )}
          </QueryState>
        </Card>
      ) : null}

      {exporting !== null ? <ExportProjectModal projectId={exporting} onClose={() => setExporting(null)} /> : null}
      <Modal
        open={deleting !== null}
        title="Eliminar proyecto"
        description={deleting ? `Se eliminará «${deleting.name}». Esta acción no se puede deshacer.` : ""}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => {
                if (!deleting) return;
                // Si es el proyecto abierto, primero se vuelve al ejemplo: así nadie vuelve a pedirlo después de borrado.
                if (deleting.id === currentId) onClosed();
                remove.mutate(deleting.id, {
                  onSuccess: () => {
                    setSelected((list) => list.filter((x) => x !== deleting.id));
                    setDeleting(null);
                  },
                });
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        {null}
      </Modal>
    </div>
  );
};
