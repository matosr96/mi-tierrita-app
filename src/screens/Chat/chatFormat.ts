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

/** "hace 5 min", "hace 2 h", "ayer"…: última conexión de quien está desconectado. */
export const sinceLabel = (iso: string | null): string => {
  if (!iso) return "Nunca se ha conectado";
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 60) return `Última conexión hace ${int(min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Última conexión hace ${int(h)} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "Última conexión ayer" : `Última conexión hace ${int(d)} días`;
};

export const sizeLabel = (bytes: number): string =>
  bytes < 1024 ? `${int(bytes)} B` : bytes < 1024 * 1024 ? `${int(Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;

export const previewText = (p: ChatPreview, empty: string): string => (p ? `${p.mine ? "Usted: " : ""}${p.body}` : empty);

export const isImage = (mime: string): boolean => /^image\/(jpeg|png|webp|gif)$/.test(mime);
