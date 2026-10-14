import { Link } from "react-router-dom";
import { Odometer } from "@/components/motion";
import type { AttentionItem } from "./AttentionList";
import styles from "./HomeScreen.module.css";

type Props = {
  /** null mientras carga. */
  items: AttentionItem[] | null;
  /** Total de pendientes si es mayor que la lista (por ejemplo, clientes con saldo). */
  total?: number;
  onSeeAll: () => void;
};

/** Lado derecho de la portada: cuántas cosas piden atención (cifra en matriz de puntos) y las tres primeras. */
export const StatusAside = ({ items, total, onSeeAll }: Props) => {
  const now = new Date();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const progress = now.getDate() / days;
  const month = now.toLocaleDateString("es-CO", { month: "long" });
  const count = items === null ? null : (total ?? items.length);

  return (
    <div className={styles.status}>
      <div className={styles.statusTop}>
        <span className={[styles.statusCount, count === 0 ? styles.statusClear : ""].join(" ")}>{count === null ? "··" : <Odometer value={String(count).padStart(2, "0")} />}</span>
        <span className={styles.statusLabel}>
          {count === null ? "Revisando…" : count === 0 ? "Sin pendientes" : count === 1 ? "Pendiente hoy" : "Pendientes hoy"}
        </span>
      </div>
      {items && items.length > 0 ? (
        <ul className={styles.statusList}>
          {items.slice(0, 3).map((item) => (
            <li key={item.key}>
              <Link to={item.to} className={styles.statusItem}>
                <span className={[styles.statusDot, item.tone === "bad" ? styles.statusDotBad : styles.statusDotWarn].join(" ")} aria-hidden="true" />
                {item.text}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {count !== null && count > 0 ? (
        <button type="button" className={styles.statusMore} onClick={onSeeAll}>
          Ver el detalle <span aria-hidden="true">↓</span>
        </button>
      ) : null}
      <div className={styles.statusMonth} aria-label={`${Math.round(progress * 100)} % de ${month} transcurrido`}>
        <span>{month}</span>
        <span className={styles.statusBar}>
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
        <span>
          {now.getDate()}/{days}
        </span>
      </div>
    </div>
  );
};
