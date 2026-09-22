import { useState, type FormEvent } from "react";
import { useCreateScenario } from "@/hooks/financial";
import type { Assumptions, CreateScenarioInput, ScenarioDetail } from "@/types/api";
import { Button, Checkbox, Field, FieldRow, Input, Modal } from "@/components/ui";
import { fieldErrors } from "@/lib/errors";
import { ASSUMPTION_FIELDS, ASSUMPTION_GROUPS } from "./financeShared";
import styles from "./FinanceScreen.module.css";

type Props = { prefill: ScenarioDetail | null; onClose: () => void; onCreated: (id: number) => void };

type AssumptionStrings = Record<keyof Assumptions, string>;
type FormState = {
  name: string;
  fixedInvestment: string;
  creditPct: string;
  termMonths: string;
  salesIncrease: string;
  additionalExpensesMonth: string;
  creditCoversWorkingCapital: boolean;
  assumptions: AssumptionStrings;
};

const PCT_KEYS = new Set<keyof Assumptions>(ASSUMPTION_FIELDS.filter((f) => f.kind === "pct").map((f) => f.key));

/** Fracción → porcentaje para el campo (0.2 → "20"), sin arrastre de decimales binarios. */
const toPercentInput = (v: number): string => String(Math.round(v * 100 * 1e4) / 1e4);
const parseNumber = (s: string): number | null => {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const emptyAssumptions = (): AssumptionStrings => Object.fromEntries(ASSUMPTION_FIELDS.map((f) => [f.key, ""])) as AssumptionStrings;

const initialState = (prefill: ScenarioDetail | null): FormState => {
  if (!prefill) {
    return { name: "", fixedInvestment: "", creditPct: "100", termMonths: "48", salesIncrease: "", additionalExpensesMonth: "", creditCoversWorkingCapital: false, assumptions: emptyAssumptions() };
  }
  const assumptions = emptyAssumptions();
  for (const f of ASSUMPTION_FIELDS) {
    const v = prefill.assumptions[f.key];
    assumptions[f.key] = PCT_KEYS.has(f.key) ? toPercentInput(v) : String(v);
  }
  return {
    name: `${prefill.name} (copia)`,
    fixedInvestment: String(prefill.fixedInvestment),
    creditPct: toPercentInput(prefill.creditPct),
    termMonths: String(prefill.termMonths),
    salesIncrease: toPercentInput(prefill.salesIncrease),
    additionalExpensesMonth: String(prefill.additionalExpensesMonth),
    creditCoversWorkingCapital: prefill.creditCoversWorkingCapital,
    assumptions,
  };
};

/** CU-14 Crear escenario. Los escenarios son inmutables: "recalcular" es crear uno nuevo. */
export const ScenarioFormModal = ({ prefill, onClose, onCreated }: Props) => {
  const [form, setForm] = useState<FormState>(() => initialState(prefill));
  const [showAssumptions, setShowAssumptions] = useState(prefill !== null);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const create = useCreateScenario();

  const serverErrors = create.error ? fieldErrors(create.error) : {};
  const errorFor = (key: string): string | undefined => clientErrors[key] ?? serverErrors[key] ?? serverErrors[`assumptions.${key}`];
  const generalError = create.error && Object.keys(serverErrors).length === 0 ? create.error.message : null;
  const details = create.error && typeof create.error.details === "string" ? create.error.details : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setAssumption = (key: keyof Assumptions, value: string) => setForm((f) => ({ ...f, assumptions: { ...f.assumptions, [key]: value } }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (form.name.trim() === "") errors.name = "Escriba un nombre para el escenario.";
    const numeric: { key: keyof Omit<FormState, "name" | "creditCoversWorkingCapital" | "assumptions">; label: string }[] = [
      { key: "fixedInvestment", label: "inversión fija" },
      { key: "creditPct", label: "porcentaje del crédito" },
      { key: "termMonths", label: "plazo" },
      { key: "salesIncrease", label: "aumento de ventas" },
      { key: "additionalExpensesMonth", label: "gastos adicionales" },
    ];
    const values: Record<string, number> = {};
    for (const n of numeric) {
      const v = parseNumber(form[n.key]);
      if (v === null) errors[n.key] = `Escriba un número para ${n.label}.`;
      else values[n.key] = v;
    }
    for (const f of ASSUMPTION_FIELDS) {
      if (form.assumptions[f.key].trim() !== "" && parseNumber(form.assumptions[f.key]) === null) errors[f.key] = "Debe ser un número.";
    }
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const assumptions: Partial<Assumptions> = {};
    for (const f of ASSUMPTION_FIELDS) {
      const v = parseNumber(form.assumptions[f.key]);
      if (v !== null) assumptions[f.key] = PCT_KEYS.has(f.key) ? v / 100 : v;
    }
    const input: CreateScenarioInput = {
      name: form.name.trim(),
      fixedInvestment: values.fixedInvestment ?? 0,
      creditPct: (values.creditPct ?? 0) / 100,
      termMonths: values.termMonths ?? 0,
      salesIncrease: (values.salesIncrease ?? 0) / 100,
      additionalExpensesMonth: values.additionalExpensesMonth ?? 0,
      creditCoversWorkingCapital: form.creditCoversWorkingCapital,
      ...(Object.keys(assumptions).length > 0 ? { assumptions } : {}),
    };
    const created = await create.mutateAsync(input).catch(() => null);
    if (created) onCreated(created.id);
  };

  return (
    <Modal
      open
      title={prefill ? "Nuevo escenario a partir del actual" : "Nuevo escenario"}
      description="La API calcula VPN, TIR, cuota y cobertura. Los porcentajes se escriben como 20 para 20 %."
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="scenario-form" loading={create.isPending}>
            Calcular escenario
          </Button>
        </>
      }
    >
      <form id="scenario-form" className={styles.form} onSubmit={submit} noValidate>
        <Field label="Nombre" htmlFor="sc-name" error={errorFor("name")}>
          <Input id="sc-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej.: Crédito 100 %, 48 meses" invalid={errorFor("name") !== undefined} autoFocus />
        </Field>
        <FieldRow>
          <Field label="Inversión fija (COP)" htmlFor="sc-fixed" hint="Obra civil, remodelación y equipos" error={errorFor("fixedInvestment")}>
            <Input id="sc-fixed" type="number" inputMode="decimal" min={0} step="any" value={form.fixedInvestment} onChange={(e) => set("fixedInvestment", e.target.value)} invalid={errorFor("fixedInvestment") !== undefined} />
          </Field>
          <Field label="Gastos fijos adicionales al mes (COP)" htmlFor="sc-exp" error={errorFor("additionalExpensesMonth")}>
            <Input id="sc-exp" type="number" inputMode="decimal" min={0} step="any" value={form.additionalExpensesMonth} onChange={(e) => set("additionalExpensesMonth", e.target.value)} invalid={errorFor("additionalExpensesMonth") !== undefined} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Crédito (% de la inversión)" htmlFor="sc-credit" hint="0 a 100" error={errorFor("creditPct")}>
            <Input id="sc-credit" type="number" inputMode="decimal" min={0} max={100} step="any" value={form.creditPct} onChange={(e) => set("creditPct", e.target.value)} invalid={errorFor("creditPct") !== undefined} />
          </Field>
          <Field label="Plazo (meses)" htmlFor="sc-term" error={errorFor("termMonths")}>
            <Input id="sc-term" type="number" inputMode="numeric" min={1} step={1} value={form.termMonths} onChange={(e) => set("termMonths", e.target.value)} invalid={errorFor("termMonths") !== undefined} />
          </Field>
          <Field label="Aumento de ventas (%)" htmlFor="sc-sales" hint="Supuesto crítico" error={errorFor("salesIncrease")}>
            <Input id="sc-sales" type="number" inputMode="decimal" step="any" value={form.salesIncrease} onChange={(e) => set("salesIncrease", e.target.value)} invalid={errorFor("salesIncrease") !== undefined} />
          </Field>
        </FieldRow>
        <Checkbox label="El crédito también financia el inventario (capital de trabajo)" checked={form.creditCoversWorkingCapital} onChange={(e) => set("creditCoversWorkingCapital", e.target.checked)} />

        <div className={styles.formSection}>
          <div className={styles.formSectionHead}>
            <div>
              <h3>Supuestos base</h3>
              <span className={styles.note}>Los campos vacíos toman el valor por defecto de la API.</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAssumptions((v) => !v)}>
              {showAssumptions ? "Ocultar" : `Mostrar los ${ASSUMPTION_FIELDS.length} supuestos`}
            </Button>
          </div>
          {showAssumptions
            ? ASSUMPTION_GROUPS.map((group) => (
                <div key={group} className={styles.form}>
                  <span className={styles.groupTitle}>{group}</span>
                  <FieldRow>
                    {ASSUMPTION_FIELDS.filter((f) => f.group === group).map((f) => {
                      const unit = f.kind === "pct" ? "%" : f.kind === "money" ? "COP" : f.kind === "months" ? "meses" : f.kind === "years" ? "años" : f.kind === "times" ? "veces/año" : "";
                      const label = unit ? `${f.label} (${unit})` : f.label;
                      return (
                        <Field key={f.key} label={label} htmlFor={`sc-a-${f.key}`} hint={f.hint} error={errorFor(f.key)}>
                          <Input
                            id={`sc-a-${f.key}`}
                            type="number"
                            inputMode="decimal"
                            step="any"
                            value={form.assumptions[f.key]}
                            onChange={(e) => setAssumption(f.key, e.target.value)}
                            invalid={errorFor(f.key) !== undefined}
                          />
                        </Field>
                      );
                    })}
                  </FieldRow>
                </div>
              ))
            : null}
        </div>

        {generalError ? (
          <div className={styles.formError} role="alert">
            {generalError}
            {details ? ` ${details}` : ""}
          </div>
        ) : null}
      </form>
    </Modal>
  );
};
