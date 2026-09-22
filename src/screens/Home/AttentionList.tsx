import { Link } from "react-router-dom";
import { Badge } from "@/components/ui";
import styles from "./HomeScreen.module.css";

export type AttentionItem = { key: string; tone: "bad" | "warn" | "neutral"; text: string; to: string; tag: string };

const DOT: Record<AttentionItem["tone"], string> = { bad: styles.dotBad ?? "", warn: styles.dotWarn ?? "", neutral: styles.dotNeutral ?? "" };

/** Lista de pendientes del lienzo: punto de color, texto y etiqueta; `boxed` es la variante con fondo suave de Secretaria y Bodega. */
export const AttentionList = ({ items, boxed = false }: { items: AttentionItem[]; boxed?: boolean }) => (
  <ul className={[styles.list, boxed ? styles.listBoxed : ""].join(" ")}>
    {items.map((item) => (
      <li key={item.key}>
        <Link to={item.to} className={[styles.item, boxed ? styles.itemBoxed : ""].join(" ")}>
          <span className={[styles.dot, DOT[item.tone]].join(" ")} aria-hidden="true" />
          <span className={styles.itemText}>{item.text}</span>
          <Badge tone={item.tone}>{item.tag}</Badge>
        </Link>
      </li>
    ))}
  </ul>
);
