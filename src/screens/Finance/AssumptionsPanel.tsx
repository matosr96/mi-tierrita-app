import type { ReactNode } from "react";
import type { ScenarioDetail } from "@/types/api";
import { dateTime, int, money, num2, pct, times } from "@/lib/format";
import { breakEven } from "./financeShared";
import { useSalesSensitivity } from "./useSalesSensitivity";
import styles from "./AssumptionsPanel.module.css";

type Props = { scenario: ScenarioDetail; letter: string };

type TagKind = "real" | "assumed" | "critical" | "computed" | "scenario" | "source";
const TAG_LABEL: Record<TagKind, string> = { real: "Dato real", assumed: "Supuesto", critical: "Supuesto crítico", computed: "Calculado por la API", scenario: "Escenario", source: "Anclado a fuente" };
const TAG_CLASS: Record<TagKind, string | undefined> = {
  real: styles.tagReal,
  assumed: styles.tagAssumed,
  critical: styles.tagCritical,
  computed: styles.tagComputed,
  scenario: styles.tagReal,
  source: styles.tagSource,
};

const Tag = ({ kind }: { kind: TagKind }) => <span className={[styles.tag, TAG_CLASS[kind] ?? ""].join(" ")}>{TAG_LABEL[kind]}</span>;

type ReadoutProps = { label: string; tag?: TagKind; prefix?: string; value: string; suffix?: string; hint?: ReactNode; wide?: boolean; text?: boolean; computed?: boolean };

/** Dato de la ficha: etiqueta, origen, cifra con sus unidades y una nota opcional. */
const Readout = ({ label, tag, prefix, value, suffix, hint, wide, text, computed }: ReadoutProps) => (
  <div className={[styles.readout, wide ? styles.wide : "", computed ? styles.computed : ""].join(" ")}>
    <div className={styles.rHead}>
      <span className={styles.rLabel}>{label}</span>
      {tag ? <Tag kind={tag} /> : computed ? <Tag kind="computed" /> : null}
    </div>
    <div className={[styles.rValue, text ? styles.rText : ""].join(" ")}>
      {prefix ? <span className={styles.rUnit}>{prefix}</span> : null}
      <span className={styles.rNum}>{value}</span>
      {suffix ? <span className={styles.rUnit}>{suffix}</span> : null}
    </div>
    {hint ? <p className={styles.rHint}>{hint}</p> : null}
  </div>
);

type SectionProps = { title: string; lede: string; children: ReactNode };

const Section = ({ title, lede, children }: SectionProps) => (
  <section className={styles.section}>
    <header className={styles.sectionHead}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionLede}>{lede}</p>
    </header>
    <div className={styles.grid}>{children}</div>
  </section>
);

/** Porcentaje como número de campo (0,21 → "21,00") para acompañarlo del sufijo "%". */
const pctField = (v: number): string => num2(v * 100);

/** Pestaña "Datos y supuestos": ficha técnica del escenario con los 17 supuestos base agrupados por sección. */
export const AssumptionsPanel = ({ scenario, letter }: Props) => {
  const { assumptions: a, indicators: ind } = scenario;
  const sensitivity = useSalesSensitivity(scenario);
  const be = sensitivity.data ? breakEven(sensitivity.data.points) : null;

  return (
    <div className={styles.sheet}>
      <div className={styles.notice} role="note">
        <p>
          <strong>Los 17 valores base son supuestos del estudio.</strong> Contrástelos con los registros de Agus y con cotizaciones formales antes de generar el reporte para el banco. Los escenarios no se editan: cada cambio crea uno nuevo, recalculado por la API y registrado con su usuario.
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.sections}>
          <Section title="Empresa y decisión" lede="Qué se evalúa y para quién.">
            <Readout label="Empresa" tag="real" value="Agropecuaria Mi Tierrita" text />
            <Readout label="Decisión evaluada" tag="real" value="Ampliar y remodelar el local con crédito bancario" text />
            <Readout label="Escenario" tag="scenario" value={scenario.name} text wide hint={`Creado por ${scenario.username} el ${dateTime(scenario.createdAt)}.`} />
          </Section>

          <Section title="Operación actual" lede="El negocio tal como está hoy, sin la ampliación.">
            <Readout label="Ventas promedio mensuales" tag="assumed" prefix="$" value={int(a.monthlySales)} suffix="COP / mes" wide hint="Validar con el promedio de facturación de Agus de los últimos 12 meses." />
            <Readout label="Costo de ventas" value={pctField(a.costOfSalesPct)} suffix="%" />
            <Readout label="Gastos fijos mensuales" prefix="$" value={int(a.fixedExpensesMonth)} />
            <Readout label="Retiros del propietario" prefix="$" value={int(a.ownerWithdrawalsMonth)} suffix="COP / mes" />
            <Readout label="Crecimiento base de ventas" value={pctField(a.baseSalesGrowth)} suffix="% anual" />
          </Section>

          <Section title="Inversión y efecto esperado" lede="Lo que cuesta la obra y lo que se espera que produzca.">
            <Readout label="Obra civil y remodelación" prefix="$" value={int(a.constructionInvestment)} />
            <Readout label="Estantería y equipos" prefix="$" value={int(a.equipmentInvestment)} />

            <div className={styles.critical}>
              <div className={styles.criticalMain}>
                <div className={styles.rHead}>
                  <span className={styles.rLabel}>Aumento esperado de ventas</span>
                  <Tag kind="critical" />
                </div>
                <div className={styles.criticalValue}>
                  <span className={styles.criticalNum}>{pctField(scenario.salesIncrease)}</span>
                  <span className={styles.criticalUnit}>%</span>
                </div>
              </div>
              <div className={styles.criticalSide}>
                {be !== null ? (
                  <div className={styles.criticalBe}>
                    <span className={styles.rLabel}>Equilibrio aprox.</span>
                    <strong>{pct(be)}</strong>
                  </div>
                ) : null}
                <p className={styles.criticalNote}>
                  {be !== null ? (
                    <>
                      Por debajo de <strong>{pct(be)}</strong> el proyecto destruye valor.{" "}
                    </>
                  ) : null}
                  Es la variable que más mueve el resultado: cuantifique las ventas que hoy se pierden por falta de espacio antes de firmar.
                </p>
              </div>
            </div>

            <Readout label="Rotación del inventario" tag="assumed" value={num2(a.inventoryTurnover)} suffix="veces / año" />
            <Readout label="Gastos fijos adicionales" prefix="$" value={int(scenario.additionalExpensesMonth)} suffix="COP / mes" />
            <Readout label="Capital de trabajo del inventario nuevo" value={money(ind.workingCapital)} computed />
            <Readout label="Inversión total" value={money(ind.totalInvestment)} computed />
          </Section>

          <Section title="Financiación" lede="Cuánto presta el banco, a qué tasa y en cuánto tiempo.">
            <Readout label="Monto del crédito" tag="computed" prefix="$" value={int(ind.credit)} />
            <Readout label="Plazo" value={int(scenario.termMonths)} suffix="meses" />
            <Readout label="Financiado con crédito" value={pctField(scenario.creditPct)} suffix="% de la obra" />
            <Readout label="Inversión fija del escenario" prefix="$" value={int(scenario.fixedInvestment)} />
            <Readout
              label="Tasa de interés"
              tag="source"
              value={pctField(a.creditRateEA)}
              suffix="% EA"
              wide
              hint="Contraste la tasa con el interés bancario corriente certificado por la Superfinanciera para el mes de la firma; debe quedar por debajo de la tasa de usura."
            />
            <Readout label="Tasa del inversionista" value={pctField(a.investorRateEA)} suffix="% EA" />
            <Readout label="Sistema de amortización" value="Francés — cuota fija" text />

            <div className={[styles.switchRow, scenario.creditCoversWorkingCapital ? styles.switchOn : ""].join(" ")}>
              <span className={styles.switch} role="img" aria-label={scenario.creditCoversWorkingCapital ? "Sí" : "No"}>
                <i />
              </span>
              <div>
                <div className={styles.switchTitle}>
                  El crédito también financia el inventario
                  <span className={styles.switchState}>{scenario.creditCoversWorkingCapital ? "Sí" : "No"}</span>
                </div>
                <p className={styles.rHint}>
                  {scenario.creditCoversWorkingCapital
                    ? `El crédito cubre la obra y el capital de trabajo: el aporte propio queda en ${money(ind.ownContribution)} y la cuota en ${money(ind.installment)}.`
                    : `Con esta opción el crédito cubriría también el capital de trabajo de ${money(ind.workingCapital)} y bajaría el aporte propio; cree un escenario nuevo para evaluarla.`}
                </p>
              </div>
            </div>

            <Readout label="Aporte propio requerido" value={money(ind.ownContribution)} computed />
            <Readout label="Cuota mensual" value={money(ind.installment)} computed />
          </Section>

          <Section title="Parámetros de evaluación" lede="Con qué vara se mide si la ampliación conviene.">
            <Readout label="TMAR" value={pctField(a.tmarEA)} suffix="% EA" />
            <Readout label="Horizonte" value={int(a.horizonYears)} suffix="años" />
            <Readout label="Inflación anual" value={pctField(a.inflation)} suffix="%" />
            <Readout label="Valor de salvamento" value={pctField(a.salvageValuePct)} suffix={`% en año ${int(a.horizonYears)}`} />
            <p className={styles.sectionNote}>
              Para un horizonte de {int(a.horizonYears)} años conviene una cifra de inflación de planeación, no la lectura del mes. Las tasas son efectivas anuales (EA) y el salvamento es un porcentaje de la inversión fija.
            </p>
          </Section>

          <Section title="Últimos cambios" lede="Los escenarios son inmutables.">
            <div className={styles.log}>
              <div className={styles.logRow}>
                <span className={styles.logDate}>{dateTime(scenario.createdAt)}</span>
                <span className={styles.logText}>
                  Escenario creado: <strong>{scenario.name}</strong> · aumento de ventas <strong>{pct(scenario.salesIncrease)}</strong> · rotación <strong>{times(a.inventoryTurnover)}/año</strong>
                </span>
                <span className={styles.logUser}>{scenario.username}</span>
              </div>
              <p className={styles.sectionNote}>Cada cambio de supuestos queda registrado como un escenario nuevo con su usuario y su fecha.</p>
            </div>
          </Section>
        </div>

        <aside className={styles.aside} aria-label="Ficha del escenario">
          <div className={styles.asideCard}>
            <h2 className={styles.asideTitle}>Ficha técnica</h2>
            <div className={styles.asideId}>
              <span className={styles.asideLetter}>{letter}</span>
              <div className={styles.asideName}>
                <strong>{scenario.name}</strong>
                <span>
                  {scenario.username} · {dateTime(scenario.createdAt)}
                </span>
              </div>
            </div>
            <dl className={styles.asideList}>
              <div>
                <dt>Inversión total</dt>
                <dd>{money(ind.totalInvestment)}</dd>
              </div>
              <div>
                <dt>Crédito</dt>
                <dd>{money(ind.credit)}</dd>
              </div>
              <div>
                <dt>Aporte propio</dt>
                <dd>{money(ind.ownContribution)}</dd>
              </div>
              <div>
                <dt>Cuota mensual</dt>
                <dd>{money(ind.installment)}</dd>
              </div>
            </dl>
            <div className={styles.legend}>
              <span className={styles.legendTitle}>Origen de cada dato</span>
              <div className={styles.legendList}>
                <Tag kind="real" />
                <Tag kind="assumed" />
                <Tag kind="critical" />
                <Tag kind="source" />
                <Tag kind="computed" />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
