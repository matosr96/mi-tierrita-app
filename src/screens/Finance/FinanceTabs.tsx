import { useLayoutEffect, useRef, useState } from "react";
import styles from "./FinanceTabs.module.css";

export type FinanceTabOption<T extends string> = { value: T; label: string; hint: string };

type Props<T extends string> = { options: FinanceTabOption<T>[]; value: T; onChange: (v: T) => void };

/** Barra de pestañas del terminal de inversión: número en mono, rótulo y una regla lima que se desliza. */
export const FinanceTabs = <T extends string>({ options, value, onChange }: Props<T>) => {
  const ref = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const active = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      setBar(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
      // En pantallas angostas la barra se desplaza: la pestaña activa queda a la vista.
      const box = ref.current;
      if (active && box && box.scrollWidth > box.clientWidth) box.scrollLeft = Math.max(0, active.offsetLeft - 16);
    };
    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options.length]);

  return (
    <div className={styles.tabs} role="tablist" aria-label="Vistas de la evaluación" ref={ref}>
      {bar ? <span className={styles.bar} style={{ transform: `translateX(${bar.left}px)`, width: bar.width }} aria-hidden="true" /> : null}
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={on} className={[styles.tab, on ? styles.active : ""].join(" ")} onClick={() => onChange(o.value)}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <span className={styles.text}>
              <span className={styles.label}>{o.label}</span>
              <span className={styles.hint}>{o.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};
