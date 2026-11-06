import { Button, Card, DataTable, Disclosure, Input, type Column } from "@/components/ui";
import { int, num2, pct } from "@/lib/format";
import type { SimCompetitor } from "@/types/api";
import { SimField } from "./SimField";
import { Highlight } from "./Highlight";
import { TabIntro } from "./TabIntro";
import { anyErrorAt, errorAt, patchSection, type TabProps } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** Fila editable: lo escrito y, si ya llegó, lo que calculó la API para ese competidor. */
type Row = SimCompetitor & { index: number; captureProbability: number | undefined; contribution: number | undefined };

/** 2. Competencia: cada competidor aporta cuota × (1 − satisfacción ÷ 5) × factor de conversión; la suma ajusta la demanda. */
export const CompetitionTab = ({ input, result, onChange, errors }: TabProps) => {
  const c = input.competition;
  const r = result.competition;
  const setList = (competitors: SimCompetitor[]) => onChange(patchSection(input, "competition", { competitors }));
  const setAt = (index: number, patch: Partial<SimCompetitor>) => setList(c.competitors.map((x, i) => (i === index ? { ...x, ...patch } : x)));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Competidor",
      render: (row) => (
        <Input aria-label={`Nombre del competidor ${row.index + 1}`} value={c.competitors[row.index]?.name ?? ""} onChange={(e) => setAt(row.index, { name: e.target.value })} invalid={errorAt(errors, `competition.competitors[${row.index}].name`) !== undefined} />
      ),
    },
    {
      key: "share",
      header: "Cuota",
      render: (row) => <SimField label="Cuota" unit="pct" value={row.share} onChange={(v) => setAt(row.index, { share: v })} error={errorAt(errors, `competition.competitors[${row.index}].share`)} />,
    },
    {
      key: "sat",
      header: "Satisfacción (1 a 5)",
      render: (row) => <SimField label="Satisfacción" unit="decimal" value={row.satisfaction} onChange={(v) => setAt(row.index, { satisfaction: v })} error={errorAt(errors, `competition.competitors[${row.index}].satisfaction`)} />,
    },
    { key: "prob", header: "Prob. de captar", align: "right", render: (row) => pct(row.captureProbability) },
    { key: "contribution", header: "Aporte a mi cuota", align: "right", render: (row) => pct(row.contribution) },
    {
      key: "remove",
      header: "",
      label: "Quitar",
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => setList(c.competitors.filter((_, i) => i !== row.index))}>
          Quitar
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.stack}>
      <TabIntro tab="competencia" />
      <Highlight
        items={[{ label: "Participación de Mi Tierrita en el mercado", value: pct(r.marketShare), hint: `${int(r.monthlyUnits)} unidades al mes · ${int(r.annualUnits)} al año` }]}
        note={
          <>
            {int(result.market.monthlyDemand)} unidades al mes del mercado × {pct(r.marketShare)} = {num2(r.monthlyUnits)} unidades al mes. «Otros» ({pct(r.othersShare)}) no aportan. Esta cuota ajusta la demanda de Mercado y alimenta
            Costos y Flujo de caja.
          </>
        }
      />
      <Card
        title="Competidores"
        subtitle="Los competidores y sus cuotas son de ejemplo: los levanta el administrador. Quien está menos satisfecho con su proveedor es más fácil de captar: probabilidad de captar = 1 − (satisfacción ÷ 5)."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setList([...c.competitors, { name: `Competidor ${c.competitors.length + 1}`, share: 0, satisfaction: 3 }])} disabled={c.competitors.length >= 20}>
            Agregar competidor
          </Button>
        }
      >
        {errorAt(errors, "competition.competitors") ? <p className={styles.errorLine}>{errorAt(errors, "competition.competitors")}</p> : null}
        <div className={styles.compTable}>
          <DataTable columns={columns} rows={c.competitors.map((x, index) => ({ ...x, index, captureProbability: r.competitors[index]?.captureProbability, contribution: r.competitors[index]?.contribution }))} rowKey={(row) => row.index} />
        </div>
        <Disclosure title="Avanzado" hint="Factor de conversión (supuesto del estudio)" forceOpen={anyErrorAt(errors, ["competition.conversionFactor"])}>
          <div className={styles.fieldsInline}>
            <SimField label="Factor de conversión" unit="decimal" hint="Aporte = cuota × prob. de captar × factor" value={c.conversionFactor} onChange={(v) => onChange(patchSection(input, "competition", { conversionFactor: v }))} error={errorAt(errors, "competition.conversionFactor")} />
          </div>
        </Disclosure>
      </Card>
    </div>
  );
};
