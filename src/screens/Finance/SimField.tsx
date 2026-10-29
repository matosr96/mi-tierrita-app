import { useEffect, useId, useState } from "react";
import { Field, Input } from "@/components/ui";
import styles from "./FinanceScreen.module.css";

/**
 * Unidad con la que se escribe el valor. La API trabaja en fracciones (0,34) y la pantalla en porcentaje (34) o
 * en puntos (−0,2): la conversión es solo de presentación, en los dos sentidos.
 */
export type SimUnit = "money" | "pct" | "points" | "int" | "decimal";

const SCALE: Record<SimUnit, number> = { money: 1, pct: 100, points: 100, int: 1, decimal: 1 };
const SUFFIX: Record<SimUnit, string> = { money: "COP", pct: "%", points: "puntos", int: "", decimal: "" };

const show = (value: number, unit: SimUnit): string => {
  const scaled = value * SCALE[unit];
  return String(Number(scaled.toPrecision(12))).replace(".", ",");
};

const read = (text: string, unit: SimUnit): number | null => {
  const clean = text.trim().replace(/\s/g, "").replace(/\./g, unit === "money" || unit === "int" ? "" : ".").replace(",", ".");
  if (clean === "" || clean === "-" || clean === "−") return null;
  const n = Number(clean.replace("−", "-"));
  return Number.isFinite(n) ? n / SCALE[unit] : null;
};

type Props = { label: string; value: number; unit: SimUnit; onChange: (value: number) => void; hint?: string; error?: string | undefined; suffix?: string };

/** Campo numérico del simulador: se escribe en la unidad de la pantalla y se envía a la API en la suya. */
export const SimField = ({ label, value, unit, onChange, hint, error, suffix }: Props) => {
  const id = useId();
  const [text, setText] = useState(() => show(value, unit));
  const [focused, setFocused] = useState(false);

  // Si el valor cambia desde fuera (abrir otro proyecto), se refleja mientras no se esté escribiendo.
  useEffect(() => {
    if (!focused) setText(show(value, unit));
  }, [value, unit, focused]);

  const unitLabel = suffix ?? SUFFIX[unit];
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error}>
      <span className={styles.simInput}>
        <Input
          id={id}
          inputMode="decimal"
          value={text}
          invalid={error !== undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(show(value, unit));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const n = read(e.target.value, unit);
            if (n !== null) onChange(n);
          }}
        />
        {unitLabel ? <span className={styles.simUnit}>{unitLabel}</span> : null}
      </span>
    </Field>
  );
};
