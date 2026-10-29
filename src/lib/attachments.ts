import type { AiAttachment } from "@/types/api";

/** Límites por archivo (el servidor también los valida). */
const MAX_PDF_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 200_000;
const MAX_IMAGE_SIDE = 1600;

export const ACCEPTED_FILES = "image/*,.pdf,application/pdf,.csv,text/csv,.txt,text/plain,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

/**
 * Dibuja una imagen reducida en un canvas con fondo blanco. `fit` la encoge para que quepa en `maxSide` por lado
 * (sin agrandarla); `cover` la recorta centrada a un cuadrado de `maxSide` (foto de perfil).
 */
export const drawScaledImage = async (file: Blob, maxSide: number, mode: "fit" | "cover" = "fit"): Promise<HTMLCanvasElement> => {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  if (mode === "cover") {
    const side = Math.min(bitmap.width, bitmap.height);
    canvas.width = maxSide;
    canvas.height = maxSide;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, maxSide, maxSide);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, maxSide, maxSide);
  } else {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  }
  bitmap.close();
  return canvas;
};

/** Foto reducida en el navegador (máx. 1600 px por lado, JPEG 0,85): basta para leer una factura y pesa poco. */
const imageAttachment = async (file: File): Promise<AiAttachment> => {
  const canvas = await drawScaledImage(file, MAX_IMAGE_SIDE);
  const data = canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
  return { kind: "image", name: file.name || "foto.jpg", mediaType: "image/jpeg", data };
};

/** Foto de perfil: recorte cuadrado centrado de 256×256 en JPEG (pesa unos pocos KB; el servidor admite hasta 1 MB). */
export const AVATAR_SIDE = 256;
export const avatarImage = async (file: File): Promise<Blob> => {
  if (!file.type.startsWith("image/")) throw new Error("Elija una imagen (JPG, PNG o WebP).");
  const canvas = await drawScaledImage(file, AVATAR_SIDE, "cover");
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))), "image/jpeg", 0.9));
};

/* ---------- Excel (.xlsx) sin dependencias: ZIP + XML de la hoja ---------- */

type ZipEntry = { name: string; method: number; size: number; offset: number };

const readZip = (buf: ArrayBuffer): ZipEntry[] => {
  const v = new DataView(buf);
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66_000); i--) {
    if (v.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("El archivo no es un Excel válido.");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  const dec = new TextDecoder();
  for (let i = 0; i < count; i++) {
    const method = v.getUint16(p + 10, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    entries.push({ name, method, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
};

const unzipEntry = async (buf: ArrayBuffer, e: ZipEntry): Promise<string> => {
  const v = new DataView(buf);
  const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
  const data = new Uint8Array(buf, start, e.size);
  if (e.method === 0) return new TextDecoder().decode(data);
  if (e.method !== 8) throw new Error("Formato de Excel no soportado.");
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
};

const colIndex = (ref: string) => [...(ref.match(/^[A-Z]+/)?.[0] ?? "A")].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
const csvCell = (s: string) => (/[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** Cada hoja del libro como CSV (valores ya calculados que guardó Excel; las fórmulas no se evalúan). */
const xlsxToText = async (file: File): Promise<string> => {
  const buf = await file.arrayBuffer();
  const entries = readZip(buf);
  const byName = new Map(entries.map((e) => [e.name, e]));
  const parser = new DOMParser();
  const shared: string[] = [];
  const sst = byName.get("xl/sharedStrings.xml");
  if (sst) {
    const doc = parser.parseFromString(await unzipEntry(buf, sst), "application/xml");
    for (const si of Array.from(doc.getElementsByTagName("si"))) shared.push(Array.from(si.getElementsByTagName("t")).map((t) => t.textContent ?? "").join(""));
  }
  const workbook = byName.get("xl/workbook.xml");
  const names = workbook ? Array.from(parser.parseFromString(await unzipEntry(buf, workbook), "application/xml").getElementsByTagName("sheet")).map((s) => s.getAttribute("name") ?? "") : [];
  const sheets = entries.filter((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name)).sort((a, b) => Number(a.name.match(/\d+/)?.[0]) - Number(b.name.match(/\d+/)?.[0]));
  const parts: string[] = [];
  for (const [i, sheet] of sheets.entries()) {
    const doc = parser.parseFromString(await unzipEntry(buf, sheet), "application/xml");
    const lines: string[] = [];
    for (const row of Array.from(doc.getElementsByTagName("row"))) {
      const cells: string[] = [];
      for (const c of Array.from(row.getElementsByTagName("c"))) {
        const idx = colIndex(c.getAttribute("r") ?? "A");
        const type = c.getAttribute("t");
        const raw = c.getElementsByTagName("v")[0]?.textContent ?? Array.from(c.getElementsByTagName("t")).map((t) => t.textContent ?? "").join("");
        const value = type === "s" ? (shared[Number(raw)] ?? "") : raw;
        while (cells.length < idx) cells.push("");
        cells[idx] = csvCell(value);
      }
      if (cells.some((x) => x !== "")) lines.push(cells.join(","));
    }
    parts.push(`# Hoja: ${names[i] ?? `Hoja ${i + 1}`}\n${lines.join("\n")}`);
  }
  return parts.join("\n\n");
};

/**
 * Convierte un archivo en adjunto para Tita: imagen → JPEG reducido; PDF → base64 (hasta 8 MB); CSV/TXT → texto;
 * Excel → CSV por hoja. Lanza un Error con un mensaje para la persona si el archivo no sirve.
 */
export const fileToAttachment = async (file: File): Promise<AiAttachment> => {
  const name = file.name || "archivo";
  const lower = name.toLowerCase();
  if (file.type.startsWith("image/")) return imageAttachment(file);
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    if (file.size > MAX_PDF_BYTES) throw new Error(`${name} pesa más de 8 MB.`);
    return { kind: "pdf", name, data: toBase64(await file.arrayBuffer()) };
  }
  if (lower.endsWith(".xlsx")) {
    const text = await xlsxToText(file);
    if (text.trim() === "") throw new Error(`${name} no tiene datos.`);
    return { kind: "text", name, text: text.slice(0, MAX_TEXT_CHARS) };
  }
  if (lower.endsWith(".csv") || lower.endsWith(".txt") || file.type.startsWith("text/")) {
    const text = await file.text();
    return { kind: "text", name, text: text.slice(0, MAX_TEXT_CHARS) };
  }
  throw new Error(`${name}: use una foto, un PDF, un Excel (.xlsx), un CSV o un .txt.`);
};
