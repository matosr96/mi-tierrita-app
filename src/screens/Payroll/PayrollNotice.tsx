import styles from "./PayrollScreen.module.css";

/** Aviso fijo del módulo: qué calcula la liquidación simplificada y qué no reemplaza. */
export const PayrollNotice = () => (
  <aside className={styles.notice} aria-label="Alcance de la nómina">
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8.5" />
      <line x1="11" y1="10" x2="11" y2="15.5" />
      <circle cx="11" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
    <div>
      <strong>Liquidación simplificada.</strong> Devengado = salario base del periodo + horas extra y recargos + bonificaciones + auxilio de
      transporte. Se descuentan salud (4 %) y pensión (4 %) sobre el salario base y las horas extra, más los otros descuentos que usted
      escriba. <strong>No reemplaza la nómina electrónica de la DIAN</strong> ni calcula prestaciones sociales (prima, cesantías, vacaciones)
      ni los aportes del empleador.
    </div>
  </aside>
);
