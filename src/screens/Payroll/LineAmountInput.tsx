import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui";
import styles from "./PayrollScreen.module.css";

type Props = {
  value: number;
  label: string;
  hint?: string;
  disabled: boolean;
  onCommit: (value: number) => void;
};

/**
 * Valor editable en línea (horas extra, bonificaciones, auxilio, otros descuentos). Envía al salir del campo o con
 * Enter, solo si cambió; Escape descarta. La pantalla lo monta con `key` = valor de la API, así se reinicia con la
 * cifra recalculada por el servidor.
 */
export const LineAmountInput = ({ value, label, hint, disabled, onCommit }: Props) => {
  const [text, setText] = useState(String(value));
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    const trimmed = text.trim();
    const next = trimmed === "" ? 0 : Number(trimmed);
    if (!Number.isFinite(next) || next < 0) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (next !== value) onCommit(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setText(String(value));
      setInvalid(false);
    }
  };

  return (
    <Input
      className={styles.amount}
      type="number"
      min={0}
      step={1}
      inputMode="numeric"
      aria-label={label}
      title={hint}
      value={text}
      disabled={disabled}
      invalid={invalid}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
      onClick={(e) => e.stopPropagation()}
    />
  );
};
