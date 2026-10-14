import { useLayoutEffect, useRef, useState } from "react";
import styles from "./Tabs.module.css";

export type TabOption<T extends string> = { value: T; label: string };

/** Control segmentado (pestañas de una pantalla) con una píldora que se desliza hasta la pestaña activa. */
export const Tabs = <T extends string>({ options, value, onChange }: { options: TabOption<T>[]; value: T; onChange: (v: T) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const active = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      setPill(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
    };
    measure();
    // Las fuentes web cambian el ancho de los rótulos al terminar de cargar.
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options.length]);

  return (
    <div className={styles.tabs} role="tablist" ref={ref}>
      {pill ? <span className={styles.pill} style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} aria-hidden="true" /> : null}
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === value} className={[styles.tab, o.value === value ? styles.active : ""].join(" ")} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
};

/** Filtros tipo chip (por ejemplo, categorías). */
export const Chips = <T extends string | number>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <div className={styles.chips}>
    {options.map((o) => (
      <button key={String(o.value)} type="button" className={[styles.chip, o.value === value ? styles.chipActive : ""].join(" ")} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);
