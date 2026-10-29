import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./RichText.module.css";

/** Enlace interno `[texto](/ruta)`: solo rutas de la app (empiezan por "/"); cualquier otra cosa se deja como texto. */
const LINK = /(\[[^\]\n]{1,80}\]\(\/[^\s)]{0,160}\))/g;
const parseLink = (part: string): { label: string; to: string } | null => {
  const m = /^\[([^\]]+)\]\((\/[^\s)]*)\)$/.exec(part);
  return m && m[1] !== undefined && m[2] !== undefined && !m[2].startsWith("//") ? { label: m[1], to: m[2] } : null;
};

/** **negrita** y enlaces internos dentro de una línea. */
const inline = (text: string, onNavigate?: () => void): ReactNode[] =>
  text.split(LINK).flatMap((chunk, i) => {
    const link = parseLink(chunk);
    if (link)
      return [
        <Link key={`l${i}`} to={link.to} className={styles.link} onClick={onNavigate}>
          {link.label}
        </Link>,
      ];
    return chunk
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, j) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={`${i}-${j}`}>{part.slice(2, -2)}</strong> : <Fragment key={`${i}-${j}`}>{part}</Fragment>));
  });

/**
 * Texto del asistente con el formato mínimo que usa (párrafos, listas con "-" o "1.", citas con ">" y negritas).
 * Se arma con elementos de React, nunca con HTML: el texto del modelo no puede inyectar marcado.
 */
export const RichText = ({ text, onNavigate }: { text: string; onNavigate?: (() => void) | undefined }) => {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let quote: string[] = [];
  const flushQuote = () => {
    if (quote.length > 0) blocks.push(<blockquote key={blocks.length}>{inline(quote.join(" "), onNavigate)}</blockquote>);
    quote = [];
  };
  const flushPara = () => {
    if (para.length > 0) blocks.push(<p key={blocks.length}>{inline(para.join(" "), onNavigate)}</p>);
    para = [];
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it, onNavigate)}</li>);
      blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    }
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    const quoted = /^>\s?(.*)$/.exec(line);
    if (quoted) {
      // Un texto para copiar y enviar (mensaje de cobro, respuesta): se muestra aparte, como cita.
      flushPara();
      flushList();
      quote.push(quoted[1] ?? "");
      continue;
    }
    flushQuote();
    if (line === "") {
      flushPara();
      flushList();
    } else if (bullet || numbered) {
      flushPara();
      const ordered = numbered !== null;
      if (list === null || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? numbered)![1] ?? "");
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push(
        <p key={blocks.length} className={styles.heading}>
          {inline(heading[1] ?? "", onNavigate)}
        </p>,
      );
    } else {
      flushList();
      para.push(line);
    }
  }
  flushQuote();
  flushPara();
  flushList();
  return <div className={styles.rich}>{blocks}</div>;
};
