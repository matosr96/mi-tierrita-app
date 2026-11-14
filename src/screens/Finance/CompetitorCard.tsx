import { Button, Input } from "@/components/ui";
import { int, num1, num2, pct } from "@/lib/format";
import type { SimCompetitor, SimulatorResult } from "@/types/api";
import { SimField } from "./SimField";
import styles from "./FinanceScreen.module.css";

type Props = {
  index: number;
  competitor: SimCompetitor;
  /** Lo que calculó la API para este competidor (puede faltar mientras llega). */
  calc: SimulatorResult["competition"]["competitors"][number] | undefined;
  monthlyDemand: number;
  conversionFactor: number;
  errors: { name?: string; share?: string; satisfaction?: string };
  onChange: (patch: Partial<SimCompetitor>) => void;
  onRemove: () => void;
};

/** Un competidor: sus datos editables y, debajo, cada cifra con la operación de la que sale. */
export const CompetitorCard = ({ index, competitor, calc, monthlyDemand, conversionFactor, errors, onChange, onRemove }: Props) => {
  const happy = calc ? 1 - calc.captureProbability : undefined;
  const lines = [
    { label: "Le compran al mes", value: `${int(calc?.monthlyPurchases)} compras`, how: `${int(monthlyDemand)} del mercado × ${pct(competitor.share)} de cuota` },
    { label: "Clientes contentos", value: pct(happy), how: `${num1(competitor.satisfaction)} ÷ 5 de satisfacción` },
    { label: "Clientes descontentos", value: pct(calc?.captureProbability), how: `100 % − ${pct(happy)} contentos` },
    { label: "Compras de descontentos", value: `${int(calc?.unhappyPurchases)} compras`, how: `${int(calc?.monthlyPurchases)} × ${pct(calc?.captureProbability)}` },
    { label: "Pasan a Mi Tierrita", value: `${int(calc?.capturedUnits)} compras`, how: `${int(calc?.unhappyPurchases)} × ${num2(conversionFactor)} (${num1(conversionFactor * 10)} de cada 10 se cambian)` },
  ];

  return (
    <article className={styles.compCard}>
      <header className={styles.compCardHead}>
        <Input aria-label={`Nombre del competidor ${index + 1}`} value={competitor.name} onChange={(e) => onChange({ name: e.target.value })} invalid={errors.name !== undefined} />
        <Button variant="ghost" size="sm" onClick={onRemove}>
          Quitar
        </Button>
      </header>
      <div className={styles.compCardFields}>
        <SimField label="Cuota del mercado" unit="pct" value={competitor.share} onChange={(v) => onChange({ share: v })} error={errors.share} />
        <SimField label="Satisfacción (1 a 5)" unit="decimal" value={competitor.satisfaction} onChange={(v) => onChange({ satisfaction: v })} error={errors.satisfaction} />
      </div>
      <dl className={styles.compCardLines}>
        {lines.map((x) => (
          <div key={x.label}>
            <dt>{x.label}</dt>
            <dd>
              <b>{x.value}</b>
              <span>{x.how}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className={styles.compCardResult}>
        <span>Aporte a la cuota de Mi Tierrita</span>
        <b>{pct(calc?.contribution)}</b>
        <small>
          {int(calc?.capturedUnits)} ÷ {int(monthlyDemand)} del mercado
        </small>
      </div>
    </article>
  );
};
