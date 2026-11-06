import { SIM_TABS, type SimTab } from "./simShared";
import styles from "./FinanceScreen.module.css";

/** Arriba de cada pestaña: la pregunta que responde (brief, sección 3) y de dónde vienen y a dónde van sus cifras. */
export const TabIntro = ({ tab }: { tab: SimTab }) => {
  const meta = SIM_TABS.find((t) => t.value === tab);
  if (!meta) return null;
  return (
    <div className={styles.intro}>
      <p className={styles.introQuestion}>
        <strong>{meta.label}:</strong> {meta.question}
      </p>
      <p className={styles.chain}>
        <span>
          <span className={styles.chainKey}>Viene de</span> {meta.from}
        </span>
        <span>
          <span className={styles.chainKey}>Alimenta a</span> {meta.feeds}
        </span>
      </p>
    </div>
  );
};
