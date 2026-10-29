import type { ReactNode } from "react";
import styles from "./Switch.module.css";

type Props = { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean; busy?: boolean; id?: string };

/** Interruptor accesible (`role="switch"`): píldora verde cuando está encendido. El rótulo va a la derecha. */
export const Switch = ({ checked, onChange, label, hint, disabled = false, busy = false, id }: Props) => (
  <div className={styles.row}>
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-busy={busy || undefined}
      className={[styles.switch, checked ? styles.on : ""].join(" ")}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
    <label className={styles.text} htmlFor={id} onClick={id ? undefined : () => (disabled || busy ? undefined : onChange(!checked))}>
      <span className={styles.label}>{label}</span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </label>
  </div>
);
