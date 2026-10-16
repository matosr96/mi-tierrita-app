import type { ReactNode } from "react";
import { GlassFan } from "./GlassFan";
import styles from "./HeroHeader.module.css";

type Props = {
  eyebrow: string;
  /** Titular (saludo); `\n` y los asteriscos de acento se ignoran. */
  title: string;
  subtitle?: ReactNode;
  /** Acciones en píldora a la derecha del saludo (como "Exportar reporte" en la referencia). */
  actions?: ReactNode;
  /** Píldoras blancas de información sobre las acciones (como "Name / ID / Status" en la referencia). */
  info?: { label: string; value: string; tone?: "good" }[];
};

/** Encabezado del Inicio sobre la franja verde: saludo grande en blanco, abanico de vidrio al centro, información y acciones a la derecha. */
export const HeroHeader = ({ eyebrow, title, subtitle, actions, info }: Props) => (
  <header className={styles.hero}>
    <GlassFan className={styles.fan} />
    <div className={styles.main}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      <h1 className={styles.title}>{title.replace(/\*/g, "").replace(/\n/g, " ")}</h1>
      {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
    </div>
    <div className={styles.side}>
      {info && info.length > 0 ? (
        <ul className={styles.info}>
          {info.map((i) => (
            <li key={i.label}>
              <span>{i.label}:</span> <b className={i.tone === "good" ? styles.good : ""}>{i.value}</b>
            </li>
          ))}
        </ul>
      ) : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  </header>
);
