import { useEffect, useState, type CSSProperties } from "react";
import styles from "./motion.module.css";

const DIGITS = "0123456789".split("");

/** Cifra con rodillos: cada dígito gira desde 0 hasta su valor, sin tocar el formato (separadores, $, %, M). */
export const Odometer = ({ value }: { value: string }) => {
  const [armed, setArmed] = useState(false);

  // Un temporizador (no requestAnimationFrame, que se congela con la pestaña oculta) da un cuadro con los rodillos en 0.
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  const chars = [...value];
  return (
    <span className={styles.odometer}>
      <span className="sr-only">{value}</span>
      {chars.map((c, i) => {
        // Las claves cuentan desde la derecha para que unidades, decenas… conserven su rodillo al cambiar el valor.
        const key = chars.length - i;
        if (!/\d/.test(c)) {
          return (
            <span key={`s${key}`} aria-hidden="true">
              {c}
            </span>
          );
        }
        const n = Number(c);
        return (
          <span key={`d${key}`} className={styles.digit} aria-hidden="true">
            <span className={styles.strip} style={{ transform: `translateY(${armed ? -n * 10 : 0}%)`, "--delay": `${i * 35}ms` } as CSSProperties}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};
