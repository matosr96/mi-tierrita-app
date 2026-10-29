import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { VIEW_MODES, type ViewMode } from "./viewMode";
import styles from "./ViewSwitch.module.css";

const icon = (children: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const MODES: Record<ViewMode, { label: string; icon: ReactNode }> = {
  cards: {
    label: "Tarjetas",
    icon: icon(
      <>
        <rect x="2" y="2" width="5" height="5" rx="1.4" />
        <rect x="9" y="2" width="5" height="5" rx="1.4" />
        <rect x="2" y="9" width="5" height="5" rx="1.4" />
        <rect x="9" y="9" width="5" height="5" rx="1.4" />
      </>,
    ),
  },
  list: {
    label: "Lista",
    icon: icon(
      <>
        <circle cx="3" cy="4" r="0.6" fill="currentColor" />
        <circle cx="3" cy="8" r="0.6" fill="currentColor" />
        <circle cx="3" cy="12" r="0.6" fill="currentColor" />
        <path d="M6 4h8M6 8h8M6 12h8" />
      </>,
    ),
  },
  table: {
    label: "Tabla",
    icon: icon(
      <>
        <rect x="2" y="2.5" width="12" height="11" rx="1.6" />
        <path d="M2 6.2h12M2 9.8h12M6.5 6.2v7.3" />
      </>,
    ),
  },
};

type Props<M extends ViewMode> = {
  value: M;
  onChange: (mode: M) => void;
  /** Subconjunto y orden de los modos; por defecto Tarjetas, Lista y Tabla. */
  modes?: readonly M[];
  ariaLabel?: string;
};

/** Selector de vista en píldora (Tarjetas / Lista / Tabla): grupo de radios con iconos, flechas para cambiar. */
export const ViewSwitch = <M extends ViewMode>({ value, onChange, modes = VIEW_MODES as readonly M[], ariaLabel = "Modo de vista" }: Props<M>) => {
  const ref = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const edge = e.key === "Home" ? 0 : e.key === "End" ? modes.length - 1 : -1;
    if (step === 0 && edge === -1) return;
    e.preventDefault();
    const current = modes.indexOf(value);
    const next = edge !== -1 ? edge : (current + step + modes.length) % modes.length;
    const mode = modes[next];
    if (mode === undefined) return;
    onChange(mode);
    ref.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <div className={styles.switch} role="radiogroup" aria-label={ariaLabel} ref={ref} onKeyDown={onKeyDown}>
      {modes.map((m) => {
        const checked = m === value;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={MODES[m].label}
            title={MODES[m].label}
            tabIndex={checked ? 0 : -1}
            className={[styles.option, checked ? styles.active : ""].join(" ")}
            onClick={() => onChange(m)}
          >
            {MODES[m].icon}
            <span className={styles.text} aria-hidden="true">
              {MODES[m].label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
