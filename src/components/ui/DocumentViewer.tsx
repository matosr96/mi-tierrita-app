import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { createPortal } from "react-dom";
import { int } from "@/lib/format";
import { Button } from "./Button";
import { Loading } from "./States";
import { useModalOpenFlag } from "./Modal";
import styles from "./DocumentViewer.module.css";

/**
 * DocumentViewer — vista previa de un archivo dentro de la app (brief 2.5, punto 34), a pantalla casi completa.
 *
 * Uso:
 *   <DocumentViewer open name="Política.pdf" mime="application/pdf" src={blob} onClose={...} onDownload={...} />
 *
 * Props:
 *   open        · muestra u oculta el visor (al cerrar devuelve el foco al control que lo abrió).
 *   name, mime  · nombre visible y tipo MIME del archivo (deciden cómo se muestra).
 *   src         · `Blob`, URL `blob:`/`http(s)` o `null` mientras se descarga (muestra "Cargando…").
 *   size        · opcional, en bytes (se muestra en la ficha de los archivos que no se pueden previsualizar).
 *   error       · opcional, texto de error en vez del contenido (por ejemplo, si la descarga falló).
 *   onClose     · cerrar (botón, Escape o clic fuera).
 *   onDownload  · opcional; si no viene, el visor descarga `src` con `name` como nombre.
 *   items/index · opcional: lista de archivos y posición actual para "Anterior"/"Siguiente" (flechas del teclado);
 *   onNavigate  · recibe la nueva posición. El contenedor cambia `name`, `mime` y `src` al nuevo ítem.
 *
 * Qué muestra según el tipo:
 *   imágenes      · con zoom (botones +, −, ajustar; rueda del ratón; arrastre para desplazarse).
 *   PDF           · en un <iframe> sobre una URL blob:; si el navegador no incrusta PDF, aviso y «Abrir en pestaña nueva».
 *   texto y CSV   · texto en <pre> o tabla sencilla (hasta 500 filas; el resto se descarga).
 *   lo demás      · (Excel, Word…) nombre, tamaño y «Descargar».
 * El chat NO lo integra todavía (lo hará su propio agente): bastará con pasar el blob de `useChatAttachment`.
 */
export type DocumentViewerItem = { name: string; mime: string; size?: number | null };

type Props = {
  open: boolean;
  name: string;
  mime: string;
  src: string | Blob | null;
  size?: number | null;
  error?: string | null;
  onClose: () => void;
  onDownload?: () => void;
  items?: DocumentViewerItem[];
  index?: number;
  onNavigate?: (index: number) => void;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';
const MAX_TEXT_CHARS = 200_000;
const MAX_CSV_ROWS = 500;
const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2, 3, 4];

export const sizeLabel = (bytes: number): string =>
  bytes < 1024 ? `${int(bytes)} B` : bytes < 1024 * 1024 ? `${int(Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;

export const viewerKind = (mime: string, name = ""): "image" | "pdf" | "csv" | "text" | "other" => {
  const m = mime.toLowerCase();
  const lower = name.toLowerCase();
  if (/^image\/(jpeg|png|webp|gif)$/.test(m)) return "image";
  if (m === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (m === "text/csv" || lower.endsWith(".csv")) return "csv";
  if (m.startsWith("text/") || lower.endsWith(".txt")) return "text";
  return "other";
};

/** CSV sencillo: coma o punto y coma, comillas dobles con escape "" y saltos de línea dentro de comillas. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const sep = (text.split("\n", 1)[0] ?? "").split(";").length > (text.split("\n", 1)[0] ?? "").split(",").length ? ";" : ",";
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim() !== ""));
};

const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FileMark = () => (
  <svg width="44" height="44" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 2.5h6.5L15 6v11.5H5z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M11.5 2.5V6H15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

/** Imagen con zoom y arrastre. */
const ImageView = ({ url, name }: { url: string; name: string }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [url]);
  const zoomTo = (next: number) => {
    const s = Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1]!, Math.max(ZOOM_STEPS[0]!, next));
    setScale(s);
    if (s === 1) setOffset({ x: 0, y: 0 });
  };
  const zoomIn = () => zoomTo(ZOOM_STEPS.find((z) => z > scale + 0.001) ?? scale);
  const zoomOut = () => zoomTo([...ZOOM_STEPS].reverse().find((z) => z < scale - 0.001) ?? scale);
  const onWheel = (e: ReactWheelEvent) => {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
    e.deltaY < 0 ? zoomIn() : zoomOut();
  };
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (scale === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  return (
    <>
      <div className={styles.zoomBar} role="group" aria-label="Zoom">
        <button type="button" className={styles.tool} onClick={zoomOut} aria-label="Alejar" disabled={scale <= ZOOM_STEPS[0]!}>
          <Icon d="M3.5 8h9" />
        </button>
        <span className={styles.zoomValue} aria-live="polite">
          {Math.round(scale * 100)} %
        </span>
        <button type="button" className={styles.tool} onClick={zoomIn} aria-label="Acercar" disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]!}>
          <Icon d="M8 3.5v9M3.5 8h9" />
        </button>
        <button type="button" className={[styles.tool, styles.toolText].join(" ")} onClick={() => zoomTo(1)} disabled={scale === 1 && offset.x === 0 && offset.y === 0}>
          Ajustar
        </button>
      </div>
      <div
        className={[styles.imageStage, scale > 1 ? styles.grab : ""].join(" ")}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => zoomTo(scale === 1 ? 2 : 1)}
      >
        <img src={url} alt={name} draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
      </div>
    </>
  );
};

/** PDF incrustado; si el navegador no puede mostrarlo (sin visor integrado, muchos móviles), ofrece la pestaña nueva. */
const PdfView = ({ url, name }: { url: string; name: string }) => {
  const canEmbed = typeof navigator !== "undefined" && "pdfViewerEnabled" in navigator ? (navigator as Navigator & { pdfViewerEnabled?: boolean }).pdfViewerEnabled !== false : true;
  if (!canEmbed) {
    return (
      <div className={styles.notice}>
        <FileMark />
        <strong>{name}</strong>
        <span>Este navegador no muestra PDF dentro de la app.</span>
        <a className={styles.linkBtn} href={url} target="_blank" rel="noopener noreferrer">
          Abrir en pestaña nueva
        </a>
      </div>
    );
  }
  return <iframe className={styles.frame} src={`${url}#toolbar=0&view=FitH`} title={name} />;
};

/** Texto plano o CSV leído del blob (acotado). */
const TextView = ({ src, kind }: { src: Blob | string; kind: "csv" | "text" }) => {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setText(null);
    const read = typeof src === "string" ? fetch(src).then((r) => r.text()) : src.text();
    read.then((t) => alive && setText(t.slice(0, MAX_TEXT_CHARS))).catch(() => alive && setText(""));
    return () => {
      alive = false;
    };
  }, [src]);
  const rows = useMemo(() => (kind === "csv" && text !== null ? parseCsv(text) : []), [kind, text]);
  if (text === null) return <Loading inline text="Leyendo el archivo…" />;
  if (kind === "csv" && rows.length > 0) {
    const [head, ...body] = rows;
    const shown = body.slice(0, MAX_CSV_ROWS);
    return (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {head!.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i}>
                {head!.map((_, j) => (
                  <td key={j}>{r[j] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {body.length > MAX_CSV_ROWS ? <p className={styles.more}>Se muestran las primeras {int(MAX_CSV_ROWS)} filas de {int(body.length)}. Descargue el archivo para verlo completo.</p> : null}
      </div>
    );
  }
  return <pre className={styles.pre}>{text === "" ? "(archivo vacío)" : text}</pre>;
};

export const DocumentViewer = ({ open, name, mime, src, size, error, onClose, onDownload, items, index, onNavigate }: Props) => {
  useModalOpenFlag(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  if (open && openerRef.current === null && typeof document !== "undefined" && document.activeElement instanceof HTMLElement) openerRef.current = document.activeElement;

  const kind = viewerKind(mime, name);
  const total = items?.length ?? 0;
  const hasNav = total > 1 && index !== undefined && onNavigate !== undefined;
  const prev = hasNav && index > 0 ? () => onNavigate(index - 1) : null;
  const next = hasNav && index < total - 1 ? () => onNavigate(index + 1) : null;

  // URL utilizable por <img>/<iframe>: un blob se expone como blob: y se libera al cambiar o cerrar.
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!open || src === null) {
      setUrl(null);
      return;
    }
    if (typeof src === "string") {
      setUrl(src);
      return;
    }
    const u = URL.createObjectURL(src);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [open, src]);

  const download = useCallback(() => {
    if (onDownload) return onDownload();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [onDownload, url, name]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && prev) prev();
      else if (e.key === "ArrowRight" && next) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, prev, next]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  const body = error ? (
    <div className={styles.notice} role="alert">
      <FileMark />
      <strong>{name}</strong>
      <span>{error}</span>
    </div>
  ) : src === null || url === null ? (
    <div className={styles.center}>
      <Loading inline text="Cargando el documento…" />
    </div>
  ) : kind === "image" ? (
    <ImageView url={url} name={name} />
  ) : kind === "pdf" ? (
    <PdfView url={url} name={name} />
  ) : kind === "csv" || kind === "text" ? (
    <TextView src={src} kind={kind} />
  ) : (
    <div className={styles.notice}>
      <FileMark />
      <strong>{name}</strong>
      <span>{size ? `${sizeLabel(size)} · ` : ""}Este tipo de archivo no se puede mostrar aquí; descárguelo para abrirlo en su programa.</span>
      <Button variant="primary" onClick={download}>
        Descargar
      </Button>
    </div>
  );

  // Va en un portal sobre <body>: el contenido de AppShell forma su propio contexto de apilamiento (view-transition-name)
  // y, dentro de él, el visor quedaría debajo de la barra superior y del botón de Tita.
  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={`Vista previa de ${name}`} ref={dialogRef} tabIndex={-1} onKeyDown={trapTab}>
        <header className={styles.head}>
          <div className={styles.title}>
            <strong title={name}>{name}</strong>
            <span className={styles.meta}>
              {size ? sizeLabel(size) : null}
              {hasNav ? `${size ? " · " : ""}${index + 1} de ${total}` : null}
            </span>
          </div>
          <div className={styles.actions}>
            {hasNav ? (
              <>
                <button type="button" className={styles.tool} onClick={prev ?? undefined} disabled={!prev} aria-label="Anterior" title="Anterior (flecha izquierda)">
                  <Icon d="M10 3.5 5.5 8l4.5 4.5" />
                </button>
                <button type="button" className={styles.tool} onClick={next ?? undefined} disabled={!next} aria-label="Siguiente" title="Siguiente (flecha derecha)">
                  <Icon d="M6 3.5 10.5 8 6 12.5" />
                </button>
              </>
            ) : null}
            {kind === "pdf" && url ? (
              <a className={styles.tool} href={url} target="_blank" rel="noopener noreferrer" aria-label="Abrir en pestaña nueva" title="Abrir en pestaña nueva">
                <Icon d="M9 3h4v4M13 3 7.5 8.5M11 9.5V12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2.5" />
              </a>
            ) : null}
            <button type="button" className={styles.tool} onClick={download} disabled={!url && !onDownload} aria-label="Descargar" title="Descargar">
              <Icon d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13h10" />
            </button>
            <button type="button" className={styles.tool} onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)">
              <Icon d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" />
            </button>
          </div>
        </header>
        <div className={styles.body}>{body}</div>
      </div>
    </div>,
    document.body,
  );
};
