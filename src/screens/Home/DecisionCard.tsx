import { Link } from "react-router-dom";
import { dateOnly, moneyCompact, pct } from "@/lib/format";
import type { Page, ScenarioSummary } from "@/types/api";
import styles from "./HomeScreen.module.css";

type QueryLike = { data: Page<ScenarioSummary> | undefined; isPending: boolean; isError: boolean };

/** Tarjeta "Decisión abierta": el último escenario financiero con su VPN y rentabilidad, o la invitación a crear uno. */
export const DecisionCard = ({ query }: { query: QueryLike }) => {
  if (query.isPending) {
    return (
      <div className={styles.decision} aria-busy="true">
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <div className={styles.decisionTitle}>Cargando…</div>
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className={styles.decision}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <div className={styles.decisionTitle}>No disponible</div>
        <div className={styles.decisionText}>No se pudieron cargar los escenarios financieros.</div>
      </div>
    );
  }
  const scenario = query.data?.items[0];
  if (!scenario) {
    return (
      <Link to="/finanzas" className={[styles.decision, styles.decisionLink].join(" ")}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <div className={styles.decisionTitle}>Sin escenarios evaluados</div>
        <div className={styles.decisionText}>Cree el primer escenario para evaluar la ampliación del local con VPN y rentabilidad.</div>
        <span className={styles.decisionCta}>Crear escenario</span>
      </Link>
    );
  }
  const ind = scenario.indicators;
  const good = ind.npv >= 0;
  return (
    <Link to={`/finanzas?escenario=${scenario.id}`} className={[styles.decision, styles.decisionLink].join(" ")}>
      <div className={styles.decisionHead}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <span className={[styles.verdict, good ? styles.verdictGood : styles.verdictBad].join(" ")}>{good ? "Conviene" : "No conviene"}</span>
      </div>
      <div className={styles.decisionTitle}>{scenario.name}</div>
      <div className={styles.decisionText}>
        Inversión de {moneyCompact(scenario.fixedInvestment)}, {pct(scenario.creditPct)} a crédito a {scenario.termMonths} meses. Evaluado por {scenario.username} el {dateOnly(scenario.createdAt)}.
      </div>
      <dl className={styles.decisionMetrics}>
        <div>
          <dt className={styles.metricLabel}>VPN</dt>
          <dd className={[styles.metricValue, good ? styles.metricGood : styles.metricBad].join(" ")}>{moneyCompact(ind.npv)}</dd>
        </div>
        <div>
          <dt className={styles.metricLabel}>Rentabilidad (TIR)</dt>
          <dd className={styles.metricValue}>{pct(ind.irr)}</dd>
        </div>
      </dl>
    </Link>
  );
};
