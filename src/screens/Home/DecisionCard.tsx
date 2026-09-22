import { Link } from "react-router-dom";
import { dateOnly, moneyCompact, pct } from "@/lib/format";
import type { Page, ScenarioSummary } from "@/types/api";
import styles from "./HomeScreen.module.css";

type QueryLike = { data: Page<ScenarioSummary> | undefined; isPending: boolean; isError: boolean };

/** Tarjeta verde "Decisión abierta": el último escenario financiero con su VPN y rentabilidad, o la invitación a crear uno. */
export const DecisionCard = ({ query }: { query: QueryLike }) => {
  if (query.isPending) {
    return (
      <div className={styles.decision}>
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
      <Link to="/finanzas" className={styles.decision}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <div className={styles.decisionTitle}>Sin escenarios evaluados</div>
        <div className={styles.decisionText}>Cree el primer escenario para evaluar la ampliación del local con VPN y rentabilidad.</div>
        <div className={styles.decisionMetrics}>
          <span className={[styles.metricValue, styles.metricGood].join(" ")}>Crear escenario →</span>
        </div>
      </Link>
    );
  }
  const ind = scenario.indicators;
  return (
    <Link to={`/finanzas?escenario=${scenario.id}`} className={styles.decision}>
      <div className={styles.decisionLabel}>Decisión abierta</div>
      <div className={styles.decisionTitle}>{scenario.name}</div>
      <div className={styles.decisionText}>
        {ind.npv >= 0 ? "Conviene" : "No conviene"} con los supuestos actuales. Inversión de {moneyCompact(scenario.fixedInvestment)}, {pct(scenario.creditPct)} a crédito a {scenario.termMonths} meses. Evaluado por {scenario.username} el {dateOnly(scenario.createdAt)}.
      </div>
      <div className={styles.decisionMetrics}>
        <span>
          <span className={styles.metricLabel}>VPN</span>
          <strong className={[styles.metricValue, styles.metricGood].join(" ")}>{moneyCompact(ind.npv)}</strong>
        </span>
        <span>
          <span className={styles.metricLabel}>Rentabilidad</span>
          <strong className={styles.metricValue}>{pct(ind.irr)}</strong>
        </span>
      </div>
    </Link>
  );
};
