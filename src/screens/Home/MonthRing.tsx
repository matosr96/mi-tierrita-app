import { useEffect, useState } from "react";
import { Odometer } from "@/components/motion";
import { int } from "@/lib/format";
import styles from "./HomeScreen.module.css";

const R = 44;
const C = 2 * Math.PI * R;

/** Avance del mes en curso (dato de calendario): anillo que se llena hasta el día de hoy. */
export const MonthRing = () => {
  const now = new Date();
  const day = now.getDate();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const left = days - day;
  const month = now.toLocaleDateString("es-CO", { month: "long" });
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className={styles.monthRing}>
      <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden="true">
        <circle cx="52" cy="52" r={R} className={styles.ringTrack} />
        <circle cx="52" cy="52" r={R} className={styles.ringFill} strokeDasharray={C} strokeDashoffset={armed ? C * (1 - day / days) : C} />
      </svg>
      <div className={styles.ringCenter}>
        <Odometer value={String(day)} />
        <span>de {days}</span>
      </div>
      <div className={styles.ringText}>
        <span className={styles.ringLabel}>{month}</span>
        <strong>{left === 0 ? "Cierre hoy" : left === 1 ? "Cierre mañana" : `Cierre en ${int(left)} días`}</strong>
        <span>{Math.round((day / days) * 100)} % del mes transcurrido</span>
      </div>
    </div>
  );
};
