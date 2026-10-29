import { Link } from "react-router-dom";
import { dateOnly, moneyCompact, pct } from "@/lib/format";
import type { Page, ProjectSummary } from "@/types/api";
import styles from "./HomeScreen.module.css";

type QueryLike = { data: Page<ProjectSummary> | undefined; isPending: boolean; isError: boolean };

/** Tarjeta "Decisión abierta": el último proyecto del simulador con su VPN y rentabilidad (mismo cálculo de Finanzas), o la invitación a crear uno. */
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
        <div className={styles.decisionText}>No se pudieron cargar los proyectos del simulador.</div>
      </div>
    );
  }
  const project = query.data?.items[0];
  if (!project) {
    return (
      <Link to="/finanzas" className={[styles.decision, styles.decisionLink].join(" ")}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <div className={styles.decisionTitle}>Sin proyectos guardados</div>
        <div className={styles.decisionText}>Abra el simulador y guarde el primer proyecto para evaluar la ampliación del local con VPN y rentabilidad.</div>
        <span className={styles.decisionCta}>Abrir el simulador</span>
      </Link>
    );
  }
  const ind = project.indicators;
  const good = ind.npv >= 0;
  return (
    <Link to={`/finanzas/flujo?proyecto=${project.id}`} className={[styles.decision, styles.decisionLink].join(" ")}>
      <div className={styles.decisionHead}>
        <div className={styles.decisionLabel}>Decisión abierta</div>
        <span className={[styles.verdict, good ? styles.verdictGood : styles.verdictBad].join(" ")}>{good ? "Conviene" : "No conviene"}</span>
      </div>
      <div className={styles.decisionTitle}>{project.name}</div>
      <div className={styles.decisionText}>
        Inversión de {moneyCompact(project.highlights.totalInvestment)}, {pct(project.highlights.creditPct)} a crédito a {project.highlights.termMonths} meses. Guardado por {project.username} el {dateOnly(project.updatedAt)}.
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
