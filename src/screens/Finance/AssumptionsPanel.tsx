import type { ReactNode } from "react";
import type { ScenarioDetail } from "@/types/api";
import { dateTime, int, money, num2, pct, times } from "@/lib/format";
import { breakEven } from "./financeShared";
import { useSalesSensitivity } from "./useSalesSensitivity";
import styles from "./FinanceScreen.module.css";

type Props = { scenario: ScenarioDetail };

type TagKind = "real" | "assumed" | "critical" | "computed" | "scenario" | "source";
const TAG_LABEL: Record<TagKind, string> = { real: "dato real", assumed: "supuesto", critical: "supuesto crítico", computed: "calculado", scenario: "escenario", source: "anclado a fuente" };
const TAG_CLASS: Record<TagKind, string> = {
  real: styles.tagReal ?? "",
  assumed: styles.tagAssumed ?? "",
  critical: styles.tagCritical ?? "",
  computed: styles.tagComputed ?? "",
  scenario: styles.tagReal ?? "",
  source: styles.tagReal ?? "",
};

const Tag = ({ kind }: { kind: TagKind }) => <span className={[styles.tag, TAG_CLASS[kind]].join(" ")}>{TAG_LABEL[kind]}</span>;

/** Etiqueta + caja de valor de solo lectura con prefijo/sufijo, como los campos del lienzo. */
const Field = ({ label, tag, prefix, value, suffix, hint }: { label: string; tag?: TagKind; prefix?: string; value: string; suffix?: string; hint?: ReactNode }) => (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>
      {label}
      {tag ? <Tag kind={tag} /> : null}
    </span>
    <div className={styles.valueBox}>
      {prefix ? <span className={styles.valuePrefix}>{prefix}</span> : null}
      <span className={styles.valueText}>{value}</span>
      {suffix ? <span className={styles.valueSuffix}>{suffix}</span> : null}
    </div>
    {hint ? <div className={styles.fieldHint}>{hint}</div> : null}
  </div>
);

const Computed = ({ label, value }: { label: string; value: string }) => (
  <div className={styles.computedRow}>
    <span className={styles.computedLabel}>{label}</span>
    <strong className={styles.computedValue}>{value}</strong>
    <Tag kind="computed" />
  </div>
);

/** Porcentaje como número de campo (0,21 → "21,00") para acompañarlo del sufijo "%". */
const pctField = (v: number): string => num2(v * 100);

/** Pestaña "Datos y supuestos": lectura del escenario y de los 17 supuestos base agrupados como en el lienzo. */
export const AssumptionsPanel = ({ scenario }: Props) => {
  const { assumptions: a, indicators: ind } = scenario;
  const sensitivity = useSalesSensitivity(scenario);
  const be = sensitivity.data ? breakEven(sensitivity.data.points) : null;

  return (
    <div className={styles.stack}>
      <div className={styles.warnBanner} role="note">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 2.2 L14.6 13.4 H1.4 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="8" y1="6.4" x2="8" y2="9.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.6" r="0.85" fill="currentColor" />
        </svg>
        <div>
          <strong>Los 17 valores base son supuestos del estudio.</strong> Contrástelos con los registros de Agus y con cotizaciones formales antes de generar el reporte para el banco. Los escenarios no se editan: cada cambio crea uno nuevo, recalculado por la API y registrado con su usuario.
        </div>
      </div>

      <div className={styles.twoCols}>
        <div className={styles.col}>
          <section className={styles.card}>
            <h2>Empresa y decisión</h2>
            <div className={styles.fields}>
              <Field label="Empresa" tag="real" value="Agropecuaria Mi Tierrita" />
              <Field label="Decisión evaluada" tag="real" value="Ampliar y remodelar el local con crédito bancario" />
              <Field label="Escenario" tag="scenario" value={scenario.name} hint={`Creado por ${scenario.username} el ${dateTime(scenario.createdAt)}.`} />
            </div>
          </section>

          <section className={styles.card}>
            <h2>Operación actual</h2>
            <div className={styles.fields}>
              <Field label="Ventas promedio mensuales" tag="assumed" prefix="$" value={int(a.monthlySales)} suffix="COP / mes" hint="Validar con el promedio de facturación de Agus de los últimos 12 meses." />
              <div className={styles.grid2}>
                <Field label="Costo de ventas" value={pctField(a.costOfSalesPct)} suffix="%" />
                <Field label="Gastos fijos mensuales" prefix="$" value={int(a.fixedExpensesMonth)} />
              </div>
              <div className={styles.grid2}>
                <Field label="Retiros del propietario" prefix="$" value={int(a.ownerWithdrawalsMonth)} suffix="COP / mes" />
                <Field label="Crecimiento base de ventas" value={pctField(a.baseSalesGrowth)} suffix="% anual" />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Inversión y efecto esperado</h2>
            <div className={styles.fields}>
              <div className={styles.grid2}>
                <Field label="Obra civil y remodelación" prefix="$" value={int(a.constructionInvestment)} />
                <Field label="Estantería y equipos" prefix="$" value={int(a.equipmentInvestment)} />
              </div>
              <div className={styles.criticalBox}>
                <span className={[styles.fieldLabel, styles.fieldLabelStrong].join(" ")}>
                  Aumento esperado de ventas
                  <Tag kind="critical" />
                </span>
                <div className={styles.valueBox}>
                  <span className={styles.valueText}>{pctField(scenario.salesIncrease)}</span>
                  <span className={styles.valueSuffix}>%</span>
                </div>
                <div className={styles.criticalNote}>
                  {be !== null ? (
                    <>
                      Por debajo de <strong>{pct(be)}</strong> el proyecto destruye valor.{" "}
                    </>
                  ) : null}
                  Es la variable que más mueve el resultado: cuantifique las ventas que hoy se pierden por falta de espacio antes de firmar.
                </div>
              </div>
              <div className={styles.grid2}>
                <Field label="Rotación del inventario" tag="assumed" value={num2(a.inventoryTurnover)} suffix="veces / año" />
                <Field label="Gastos fijos adicionales" prefix="$" value={int(scenario.additionalExpensesMonth)} suffix="COP / mes" />
              </div>
              <Computed label="Capital de trabajo que exige el inventario nuevo" value={money(ind.workingCapital)} />
              <Computed label="Inversión total" value={money(ind.totalInvestment)} />
            </div>
          </section>
        </div>

        <div className={styles.col}>
          <section className={styles.card}>
            <h2>Financiación</h2>
            <div className={styles.fields}>
              <div className={styles.grid2}>
                <Field label="Monto del crédito" tag="computed" prefix="$" value={int(ind.credit)} />
                <Field label="Plazo" value={int(scenario.termMonths)} suffix="meses" />
              </div>
              <div className={styles.grid2}>
                <Field label="Financiado con crédito" value={pctField(scenario.creditPct)} suffix="% de la obra" />
                <Field label="Inversión fija del escenario" prefix="$" value={int(scenario.fixedInvestment)} />
              </div>
              <Field
                label="Tasa de interés"
                tag="source"
                value={pctField(a.creditRateEA)}
                suffix="% EA"
                hint="Contraste la tasa con el interés bancario corriente certificado por la Superfinanciera para el mes de la firma; debe quedar por debajo de la tasa de usura."
              />
              <div className={styles.grid2}>
                <Field label="Tasa del inversionista" value={pctField(a.investorRateEA)} suffix="% EA" />
                <Field label="Sistema de amortización" value="Francés — cuota fija" />
              </div>
              <div className={styles.checkRow}>
                <input type="checkbox" checked={scenario.creditCoversWorkingCapital} readOnly onClick={(e) => e.preventDefault()} aria-label="El crédito también financia el inventario" />
                <span>
                  El crédito también financia el inventario
                  <br />
                  <span className={styles.checkRowHint}>
                    {scenario.creditCoversWorkingCapital
                      ? `El crédito cubre la obra y el capital de trabajo: el aporte propio queda en ${money(ind.ownContribution)} y la cuota en ${money(ind.installment)}.`
                      : `Con esta opción el crédito cubriría también el capital de trabajo de ${money(ind.workingCapital)} y bajaría el aporte propio; cree un escenario nuevo para evaluarla.`}
                  </span>
                </span>
              </div>
              <Computed label="Aporte propio requerido" value={money(ind.ownContribution)} />
              <Computed label="Cuota mensual" value={money(ind.installment)} />
            </div>
          </section>

          <section className={styles.card}>
            <h2>Parámetros de evaluación</h2>
            <div className={styles.fields}>
              <div className={styles.grid2}>
                <Field label="TMAR" value={pctField(a.tmarEA)} suffix="% EA" />
                <Field label="Horizonte" value={int(a.horizonYears)} suffix="años" />
              </div>
              <div className={styles.grid2}>
                <Field label="Inflación anual" value={pctField(a.inflation)} suffix="%" />
                <Field label="Valor de salvamento" value={pctField(a.salvageValuePct)} suffix={`% en año ${int(a.horizonYears)}`} />
              </div>
              <div className={styles.sectionNote}>
                Para un horizonte de {int(a.horizonYears)} años conviene una cifra de inflación de planeación, no la lectura del mes. Las tasas son efectivas anuales (EA) y el salvamento es un porcentaje de la inversión fija.
              </div>
            </div>
          </section>

          <section className={[styles.card, styles.cardSoft].join(" ")}>
            <h2>Últimos cambios</h2>
            <div className={styles.changes}>
              <div className={styles.changeRow}>
                <span className={styles.changeDate}>{dateTime(scenario.createdAt)}</span>
                <span className={styles.changeText}>
                  Escenario creado: <strong>{scenario.name}</strong> · aumento de ventas <strong>{pct(scenario.salesIncrease)}</strong> · rotación <strong>{times(a.inventoryTurnover)}/año</strong>
                </span>
                <span className={styles.changeUser}>{scenario.username}</span>
              </div>
            </div>
            <div className={styles.sectionNote}>Los escenarios son inmutables: cada cambio de supuestos queda registrado como un escenario nuevo con su usuario y su fecha.</div>
          </section>
        </div>
      </div>
    </div>
  );
};
