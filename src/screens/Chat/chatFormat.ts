import { int } from "@/lib/format";
import type { ChatPreview } from "@/types/api";

/** Ayudantes de presentación del chat (fechas relativas, tamaños, búsqueda sin tildes). */
export const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
};

export const timeLabel = (iso: string): string => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/** "Hoy 3:05 p. m.", "Ayer 9:10 a. m.", "lunes 12 de octubre 4:00 p. m.". */
export const whenLabel = (iso: string): string => `${dayLabel(iso)} ${timeLabel(iso)}`;

/** "Últ. vez hace 5 min", "Últ. vez hace 2 h", "Últ. vez ayer"…: última conexión de quien está desconectado. */
export const sinceLabel = (iso: string | null): string => {
  if (!iso) return "Nunca se ha conectado";
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 60) return `Últ. vez hace ${int(min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Últ. vez hace ${int(h)} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Últ. vez ayer" : `Últ. vez hace ${int(d)} días`;
};

/** Presencia para el panel de personas: "Activo ahora" o la última conexión. */
export const presenceLabel = (online: boolean, lastSeenAt: string | null): string => (online ? "Activo ahora" : sinceLabel(lastSeenAt));

/** Duración de una nota de voz en "m:ss" (o "h:mm:ss"). */
export const durationLabel = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return "–:––";
  const total = Math.round(ms / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

export const sizeLabel = (bytes: number): string =>
  bytes < 1024 ? `${int(bytes)} B` : bytes < 1024 * 1024 ? `${int(Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;

export const previewText = (p: ChatPreview, empty: string): string => (p ? `${p.mine ? "Usted: " : ""}${p.body}` : empty);

export const isImage = (mime: string): boolean => /^image\/(jpeg|png|webp|gif)$/.test(mime);
/** Notas de voz: lo que graba el navegador (WebM/Ogg con Opus, MP4 en Safari) o MP3. */
export const isAudio = (mime: string): boolean => /^audio\/(webm|ogg|mp4|mpeg)$/.test(mime.split(";")[0]!.trim());
/** Texto corto de un mensaje sin cuerpo (adjuntos): "Nota de voz" o los nombres de los archivos. */
export const bodyOrFiles = (m: { body: string; attachments: { name: string; mime: string }[] }): string =>
  m.body || (m.attachments.length > 0 && m.attachments.every((a) => isAudio(a.mime)) ? "Nota de voz" : `Archivo: ${m.attachments.map((a) => a.name).join(", ")}`);
