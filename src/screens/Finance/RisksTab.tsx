import { useState } from "react";
import { Button, Card, DataTable, type Column } from "@/components/ui";
import { AiDraftModal } from "@/components/ai/AiDraftModal";
import { useAiStatus } from "@/hooks/ai";
import { TornadoChart } from "@/components/charts";
import { money, moneyCompact, pct, times, years } from "@/lib/format";
import type { SimScenarioRow, SimTornadoBar } from "@/types/api";
import { ratesNote } from "./ratesNote";
import { SimulatorReport } from "./SimulatorReport";
import type { TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

const tornadoColumns: Column<SimTornadoBar>[] = [
  { key: "label", header: "Variable", render: (t) => t.label },
  { key: "change", header: "Cambio", render: (t) => t.change },
  { key: "low", header: "VPN a la baja", align: "right", render: (t) => <span className={t.npvLow < 0 ? styles.bad : ""}>{money(t.npvLow)}</span> },
  { key: "high", header: "VPN al alza", align: "right", render: (t) => <span className={t.npvHigh < 0 ? styles.bad : ""}>{money(t.npvHigh)}</span> },
  { key: "amp", header: "Amplitud", align: "right", render: (t) => money(t.amplitude) },
];

const scenarioColumns: Column<SimScenarioRow>[] = [
  { key: "label", header: "Escenario", render: (s) => <strong>{s.label}</strong> },
  { key: "what", header: "Supuesto", render: (s) => (s.key === "base" ? "Como está" : `Demanda ${pct(s.demandChange)}, precio ${pct(s.priceChange)}`) },
  { key: "npv", header: "VPN", align: "right", render: (s) => <span className={s.npv < 0 ? styles.bad : styles.good}>{money(s.npv)}</span> },
  { key: "irr", header: "TIR", align: "right", render: (s) => pct(s.irr) },
  { key: "payback", header: "Recuperación", align: "right", render: (s) => years(s.paybackSimple) },
  { key: "bc", header: "B/C", align: "right", render: (s) => times(s.benefitCostRatio) },
];

/** 7. Riesgos e informe: tornado, escenarios pesimista/base/optimista, por qué estas tasas y el informe PDF/Excel. */
export const RisksTab = ({ name, projectId, input, result }: TabProps & { name: string; projectId: number | null }) => {
  const r = result.risks;
  const top = r.tornado[0];
  const ai = useAiStatus();
  const [explainOpen, setExplainOpen] = useState(false);
  // Tita lee el proyecto guardado (la misma fuente); sin guardar no hay qué explicarle.
  const canExplain = ai.enabled && projectId !== null;
  return (
    <div className={styles.stack}>
      <Card
        title="¿Qué pasa si me va peor?"
        subtitle={`Cada variable se mueve por separado; las demás quedan fijas. VPN base ${moneyCompact(r.baseNpv)}.${top ? ` Lo que más pesa: ${top.label.toLowerCase()}.` : ""}`}
      >
        <TornadoChart data={r.tornado.map((t) => ({ label: `${t.label} ${t.change}`, low: t.npvLow, high: t.npvHigh }))} base={r.baseNpv} format={moneyCompact} />
      </Card>
      <Card title="Tornado en cifras" flush>
        <DataTable columns={tornadoColumns} rows={r.tornado} rowKey={(t) => t.variable} scroll />
      </Card>
      <Card title="Escenarios pesimista, base y optimista" flush>
        <DataTable columns={scenarioColumns} rows={result.scenarios} rowKey={(s) => s.key} scroll />
      </Card>
      <Card title="Informe del proyecto" subtitle="Seis secciones en el orden de las pestañas, con las mismas cifras de la pantalla." actions={
          <div className={styles.actionsRow}>
            <SimulatorReport name={name} projectId={projectId} input={input} result={result} />
            {canExplain ? (
              <Button variant="secondary" onClick={() => setExplainOpen(true)}>
                Explicar con Tita
              </Button>
            ) : null}
          </div>
        }
      >
        <div className={styles.prose}>
          <h3 className={styles.proseTitle}>Por qué estas tasas</h3>
          {ratesNote(result).map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
      </Card>
      {canExplain ? (
        <AiDraftModal open={explainOpen} onClose={() => setExplainOpen(false)} title="El proyecto en palabras simples" description={`${name} · según lo último guardado`} request={{ kind: "scenario_explain", projectId: projectId! }} />
      ) : null}
    </div>
  );
};
