import type { ScenarioDetail } from "@/types/api";
import { Button, Callout, Card } from "@/components/ui";
import { dateTime, money, pct } from "@/lib/format";
import { ASSUMPTION_FIELDS, ASSUMPTION_GROUPS, formatValue } from "./financeShared";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail; onDuplicate: () => void };

/** Pestaña "Datos y supuestos": lectura de los parámetros del escenario y de los 17 supuestos base. */
export const AssumptionsPanel = ({ scenario, onDuplicate }: Props) => {
  const { assumptions: a, indicators: ind } = scenario;
  const scenarioRows: { label: string; value: string; tag?: string }[] = [
    { label: "Inversión fija", value: money(scenario.fixedInvestment) },
    { label: "Porcentaje financiado con crédito", value: pct(scenario.creditPct) },
    { label: "Plazo del crédito", value: `${scenario.termMonths} meses` },
    { label: "Aumento de ventas esperado", value: pct(scenario.salesIncrease), tag: "supuesto crítico" },
    { label: "Gastos fijos adicionales al mes", value: money(scenario.additionalExpensesMonth) },
    { label: "El crédito también financia el inventario", value: scenario.creditCoversWorkingCapital ? "Sí" : "No" },
  ];
  const computedRows: { label: string; value: string }[] = [
    { label: "Capital de trabajo que exige el inventario nuevo", value: money(ind.workingCapital) },
    { label: "Inversión total", value: money(ind.totalInvestment) },
    { label: "Monto del crédito", value: money(ind.credit) },
    { label: "Aporte propio requerido", value: money(ind.ownContribution) },
    { label: "Cuota mensual", value: money(ind.installment) },
  ];

  return (
    <div className={styles.panel}>
      <Callout tone="warn" title="Los escenarios no se editan">
        <span className={styles.calloutText}>
          Cada cambio en los supuestos crea un escenario nuevo, recalculado por la API y registrado con su usuario. Creado por {scenario.username} el {dateTime(scenario.createdAt)}.
        </span>
      </Callout>

      <div className={styles.assumptionGrid}>
        <div className={styles.column}>
          <Card
            title="Escenario"
            subtitle={scenario.name}
            actions={
              <Button variant="secondary" size="sm" onClick={onDuplicate}>
                Nuevo escenario a partir de este
              </Button>
            }
          >
            <dl className={styles.dl}>
              {scenarioRows.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} tag={r.tag} />
              ))}
            </dl>
          </Card>
          <Card title="Calculado por la API" subtitle="A partir del escenario y los supuestos">
            <dl className={styles.dl}>
              {computedRows.map((r) => (
                <Row key={r.label} label={r.label} value={r.value} tag="calculado" />
              ))}
            </dl>
          </Card>
          {ASSUMPTION_GROUPS.slice(0, 1).map((group) => (
            <GroupCard key={group} group={group} scenario={scenario} />
          ))}
        </div>
        <div className={styles.column}>
          {ASSUMPTION_GROUPS.slice(1).map((group) => (
            <GroupCard key={group} group={group} scenario={scenario} />
          ))}
          <p className={styles.note}>
            Horizonte de {a.horizonYears} años con inflación de {pct(a.inflation)} anual. Los porcentajes de tasa son efectivos anuales (EA).
          </p>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, tag, hint }: { label: string; value: string; tag?: string | undefined; hint?: string | undefined }) => (
  <>
    <dt>
      <span>
        {label}
        {tag ? <span className={styles.tag}>{tag}</span> : null}
      </span>
      {hint ? <small>{hint}</small> : null}
    </dt>
    <dd>{value}</dd>
  </>
);

const GroupCard = ({ group, scenario }: { group: string; scenario: ScenarioDetail }) => {
  const fields = ASSUMPTION_FIELDS.filter((f) => f.group === group);
  return (
    <Card title={group}>
      <dl className={styles.dl}>
        {fields.map((f) => (
          <Row key={f.key} label={f.label} value={formatValue(f.kind, scenario.assumptions[f.key])} hint={f.hint} tag={f.key === "salesIncreasePct" ? "supuesto crítico" : undefined} />
        ))}
      </dl>
    </Card>
  );
};
