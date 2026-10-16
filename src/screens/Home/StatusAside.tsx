import { Link } from "react-router-dom";
import type { AttentionItem } from "./attention";
import styles from "./HomeScreen.module.css";

type Props = {
  /** Titular del estado del día (por ejemplo, "Una cosa requiere su atención hoy."). */
  title: string;
  /** null mientras carga. */
  items: AttentionItem[] | null;
  /** Total de pendientes si es mayor que la lista (por ejemplo, clientes con saldo). */
  total?: number | undefined;
  /** A dónde lleva el botón principal. */
  to: string;
  /** Qué vigila esta tarjeta para el rol (se muestra cuando no hay pendientes). */
  watches: string;
};

/**
 * Tarjeta destacada con degradado verde (como "Revenue is accelerating" en la referencia): el estado del día y los
 * pendientes, cada uno con enlace a su pantalla.
 */
export const StatusAside = ({ title, items, total, to, watches }: Props) => {
  const count = items === null ? null : (total ?? items.length);
  return (
    <section id="pendientes" className={styles.spot} aria-label="Pendientes de hoy" aria-busy={count === null}>
      <span className={styles.spotEyebrow}>{count === null ? "Revisando…" : count === 0 ? "Sin pendientes" : count === 1 ? "1 pendiente" : `${count} pendientes`}</span>
      <h2 className={styles.spotTitle}>{title.replace(/\*/g, "").replace(/\n/g, " ")}</h2>
      {items && items.length > 0 ? (
        <ul className={styles.spotList}>
          {items.slice(0, 5).map((item) => (
            <li key={item.key}>
              <Link to={item.to} className={styles.spotItem}>
                <span className={[styles.dot, item.tone === "bad" ? styles.dotBad : item.tone === "warn" ? styles.dotWarn : styles.dotNeutral].join(" ")} aria-hidden="true" />
                <span className={styles.itemText}>{item.text}</span>
                <span className={styles.spotTag}>{item.tag}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : count === 0 ? (
        <p className={styles.spotText}>Todo en orden por ahora. Aquí aparecerán {watches}.</p>
      ) : null}
      <Link to={to} className={styles.spotBtn}>
        Ver detalle <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
};
