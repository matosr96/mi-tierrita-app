import { Fragment, type CSSProperties } from "react";
import styles from "./motion.module.css";

type Props = {
  /** Texto a revelar. `*así*` se pinta en serif cursiva y `\n` fuerza un salto de línea. */
  text: string;
  /** Retardo inicial en milisegundos. */
  delay?: number;
  /** Separación entre palabras en milisegundos. */
  stagger?: number;
  className?: string;
};

type Word = { text: string; serif: boolean; breakAfter: boolean };

const parse = (text: string): Word[] => {
  const words: Word[] = [];
  text.split(/(\*[^*]+\*)/).forEach((chunk) => {
    const serif = chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 1;
    const body = serif ? chunk.slice(1, -1) : chunk;
    body.split("\n").forEach((line, li, lines) => {
      const parts = line.split(/\s+/).filter(Boolean);
      parts.forEach((p, pi) => words.push({ text: p, serif, breakAfter: li < lines.length - 1 && pi === parts.length - 1 }));
      if (parts.length === 0 && li < lines.length - 1 && words.length > 0) words[words.length - 1]!.breakAfter = true;
    });
  });
  return words;
};

/** Titular editorial: cada palabra sube desde detrás de una máscara, una tras otra. */
export const SplitText = ({ text, delay = 0, stagger = 55, className }: Props) => {
  const words = parse(text);
  return (
    <span className={[styles.split, className ?? ""].join(" ")} aria-label={text.replace(/\*/g, "").replace(/\n/g, " ")}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className={styles.mask} aria-hidden="true">
            <span className={[styles.word, w.serif ? styles.serif : ""].join(" ")} style={{ "--delay": `${delay + i * stagger}ms` } as CSSProperties}>
              {w.text}
            </span>
          </span>
          {w.breakAfter ? <br /> : i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
};
