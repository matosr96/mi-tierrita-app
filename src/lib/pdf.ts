/**
 * PDF descargable en el cliente: dibuja el documento (portada y hoja) con el propio navegador (`html-to-image`, que
 * respeta todo el CSS del tema, incluidos `color-mix` y las fuentes) y lo arma en hojas A4 con `jsPDF`. Las páginas se
 * cortan entre bloques (`[data-print-block]`) o entre filas de tabla, nunca a mitad de un gráfico si cabe entero, y
 * cada hoja lleva «Página X de Y». Las dos librerías se cargan solo al generar el primer PDF.
 */
import { FONT_FILES } from "./fonts";
import { saveBlob } from "./xlsx";

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 12;
const MARGIN_TOP = 12;
const MARGIN_BOTTOM = 16;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;
/** Ancho en píxeles CSS de la portada: el del área útil de un A4 a 96 ppp (está diseñada en mm para ese tamaño). */
const COVER_W = Math.round((CONTENT_W / 25.4) * 96);
/**
 * Ancho de la hoja del reporte: más ancho que el A4 para que las tablas de varias columnas quepan enteras junto a la
 * columna de indicadores; al pasarla a la hoja se reduce (la letra queda cerca de 8 pt).
 */
const PAPER_W = 1000;
/** Resolución del dibujo (2 = nítido al imprimir sin volver el archivo enorme). */
const SCALE = 2;
/** Alto máximo del lienzo: `html-to-image` reduce en silencio todo lo que pase de 16.384 px. */
const MAX_CANVAS = 16000;

type Doc = InstanceType<(typeof import("jspdf"))["jsPDF"]>;

/** Lee un archivo como data URL. */
const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

let fontCss: Promise<string> | null = null;
/**
 * `@font-face` de las fuentes de la app (`FONT_FILES`, servidas desde la propia app) con cada archivo incrustado como
 * data URL: un dibujo SVG no carga fuentes externas y, sin esto, el PDF sale con la letra del sistema, más ancha que
 * Urbanist, y los textos se desbordan. Se arma una vez; si falla, el PDF sale con la fuente de respaldo.
 */
const embeddedFonts = (): Promise<string> => {
  fontCss ??= Promise.all(
    FONT_FILES.map(async (f) => {
      const res = await fetch(f.url);
      if (!res.ok) throw new Error(`No se pudo leer ${f.url}`);
      const data = await toDataUrl(await res.blob());
      return `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};src:url(${data}) format("woff2");unicode-range:${f.unicodeRange};}`;
    }),
  )
    .then((faces) => faces.join("\n"))
    .catch(() => {
      fontCss = null;
      return "";
    });
  return fontCss;
};

/** Safari no aplica las fuentes ni las imágenes en el primer dibujo de un SVG: allí se dibuja dos veces. */
const isSafari = (): boolean => /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);

/** Copia el elemento en un contenedor fuera de pantalla con el ancho de la hoja y sin los adornos de pantalla. */
const stage = (el: HTMLElement, width: number): { host: HTMLDivElement; copy: HTMLElement } => {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", left: "-100000px", top: "0", width: `${width}px`, background: "#ffffff", zIndex: "-1" });
  const copy = el.cloneNode(true) as HTMLElement;
  copy.removeAttribute("hidden");
  Object.assign(copy.style, { margin: "0", boxShadow: "none", border: "none", borderRadius: "0", padding: "0", maxWidth: "none", width: "100%", transform: "none" });
  host.appendChild(copy);
  document.body.appendChild(host);
  // Las indicaciones de uso en pantalla («toque una barra…») no tienen sentido en papel.
  copy.querySelectorAll<HTMLElement>("span, p").forEach((n) => {
    if (n.children.length === 0 && /toque/i.test(n.textContent ?? "")) n.textContent = (n.textContent ?? "").replace(/\s*·?\s*toque[^·]*/gi, "").trim();
  });
  // En papel no hay desplazamiento: las tablas con barra horizontal se muestran completas.
  copy.querySelectorAll<HTMLElement>("*").forEach((n) => {
    const o = getComputedStyle(n).overflowX;
    if (o === "auto" || o === "scroll") n.style.overflow = "visible";
  });
  return { host, copy };
};

/** Posiciones (en px CSS desde el borde superior) donde se puede cortar la página sin partir un bloque ni una fila. */
const breakPoints = (root: HTMLElement): number[] => {
  const top = root.getBoundingClientRect().top;
  const points = new Set<number>();
  root.querySelectorAll<HTMLElement>("[data-print-block], tr, figure, p, h4, h5").forEach((n) => {
    const r = n.getBoundingClientRect();
    // Antes de una nota («Fuente: …») no se corta, para que no quede separada de su gráfico o tabla.
    if (n.tagName !== "P") points.add(Math.round(r.top - top));
    // Después de un título tampoco: quedaría solo al pie de la página, lejos de lo que rotula.
    if (n.tagName !== "H4" && n.tagName !== "H5") points.add(Math.round(r.bottom - top));
  });
  return [...points].filter((p) => p > 0).sort((a, b) => a - b);
};

/** Recorta una franja horizontal del lienzo (en px CSS; `scale` = px del lienzo por px CSS) y la devuelve como JPEG. */
const slice = (canvas: HTMLCanvasElement, scale: number, from: number, to: number): string => {
  const part = document.createElement("canvas");
  part.width = canvas.width;
  part.height = Math.max(1, Math.round((to - from) * scale));
  const ctx = part.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite dibujar el PDF.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, part.width, part.height);
  ctx.drawImage(canvas, 0, Math.round(from * scale), canvas.width, part.height, 0, 0, part.width, part.height);
  return part.toDataURL("image/jpeg", 0.92);
};

const draw = async (el: HTMLElement, width: number) => {
  const { toCanvas } = await import("html-to-image");
  const { host, copy } = stage(el, width);
  try {
    const fontEmbedCSS = await embeddedFonts();
    await Promise.all(["400 16px Urbanist", "700 16px Urbanist", "400 12px 'Geist Mono'"].map((f) => document.fonts.load(f).catch(() => [])));
    await document.fonts.ready;
    const height = copy.scrollHeight;
    // Documentos largos (el informe del proyecto pasa de 13.000 px): se baja la resolución para no pasar el tope del lienzo.
    const pixelRatio = Math.min(SCALE, MAX_CANVAS / height);
    const options = { pixelRatio, backgroundColor: "#ffffff", width, height, cacheBust: false, ...(fontEmbedCSS ? { fontEmbedCSS } : {}) };
    if (isSafari()) await toCanvas(copy, { ...options, pixelRatio: 0.25 });
    const canvas = await toCanvas(copy, options);
    return { canvas, height, scale: canvas.height / height, points: breakPoints(copy) };
  } finally {
    host.remove();
  }
};

/** Agrega la portada en una hoja propia, ajustada al área útil sin deformarla. */
const addCover = async (pdf: Doc, el: HTMLElement) => {
  const { canvas, height } = await draw(el, COVER_W);
  const mmPerPx = CONTENT_W / COVER_W;
  const ratio = Math.min(1, CONTENT_H / (height * mmPerPx));
  const w = CONTENT_W * ratio;
  const h = height * mmPerPx * ratio;
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", MARGIN_X + (CONTENT_W - w) / 2, MARGIN_TOP, w, h);
};

/** Agrega la hoja del reporte repartida en tantas páginas como haga falta, cortando en los puntos seguros. */
const addPaper = async (pdf: Doc, el: HTMLElement, firstOnNewPage: boolean) => {
  const { canvas, height, scale, points } = await draw(el, PAPER_W);
  const mmPerPx = CONTENT_W / PAPER_W;
  const pagePx = CONTENT_H / mmPerPx;
  let start = 0;
  let first = true;
  while (start < height - 1) {
    const limit = start + pagePx;
    let end = height <= limit ? height : 0;
    if (end === 0) {
      // El último punto seguro que cabe; si ninguno deja al menos un cuarto de página, se corta al límite.
      const safe = points.filter((p) => p > start + pagePx * 0.25 && p <= limit);
      end = safe.length > 0 ? (safe[safe.length - 1] as number) : limit;
    }
    if (!first || firstOnNewPage) pdf.addPage();
    first = false;
    pdf.addImage(slice(canvas, scale, start, end), "JPEG", MARGIN_X, MARGIN_TOP, CONTENT_W, (end - start) * mmPerPx);
    start = end;
  }
};

/** «Página X de Y» en el margen inferior derecho de cada hoja. */
const addPageNumbers = (pdf: Doc) => {
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(110, 120, 114);
    pdf.text(`Página ${i} de ${total}`, PAGE_W - MARGIN_X, PAGE_H - 8, { align: "right" });
  }
};

/**
 * Genera el PDF (portada opcional + hoja) y lo guarda con «Guardar como» o descarga directa (`saveBlob`). El papel
 * siempre sale en el tema claro. Resuelve `false` si la persona canceló «Guardar como».
 */
export const downloadPdf = async ({ cover, paper, filename, title }: { cover?: HTMLElement | null; paper: HTMLElement; filename: string; title?: string }): Promise<boolean> => {
  const { jsPDF } = await import("jspdf");
  const root = document.documentElement;
  const previousTheme = root.dataset["theme"];
  root.dataset["theme"] = "light";
  try {
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ title: title ?? filename.replace(/\.pdf$/i, ""), creator: "Mi Tierrita SIG" });
    if (cover) await addCover(pdf, cover);
    await addPaper(pdf, paper, Boolean(cover));
    addPageNumbers(pdf);
    return await saveBlob(filename, pdf.output("blob"), "Documento PDF");
  } finally {
    if (previousTheme === undefined) delete root.dataset["theme"];
    else root.dataset["theme"] = previousTheme;
  }
};
