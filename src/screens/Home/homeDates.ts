import { greeting, int, longToday } from "@/lib/format";

/** "Buenos días,\n*Nombre.*" según la hora: el nombre va en serif cursiva en la portada. */
export const greetingFor = (firstName: string): string => `${greeting()},\n*${firstName}.*`;

/** "Martes 22 de septiembre · cierre de septiembre en 8 días": dato de calendario, no de la API. */
export const monthCloseLine = (): string => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const left = lastDay - now.getDate();
  const month = now.toLocaleDateString("es-CO", { month: "long" });
  return `${longToday()} · cierre de ${month} ${left === 0 ? "hoy" : left === 1 ? "mañana" : `en ${int(left)} días`}`;
};

/** Nombre del mes en curso con inicial mayúscula, para subtítulos de tarjetas. */
export const monthName = (): string => new Date().toLocaleDateString("es-CO", { month: "long" }).replace(/^\w/, (c) => c.toUpperCase());

/** Hora "10:42" de una marca de tiempo ISO, como en la columna Hora del lienzo. */
export const timeOnly = (iso: string): string => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

/**
 * Titular de la portada que responde "¿está todo bien?": todo en orden o cuántas cosas piden atención.
 * Mientras carga, el saludo de siempre.
 */
export const statusTitle = (count: number | null, firstName: string): string => {
  if (count === null) return greetingFor(firstName);
  if (count === 0) return `Todo en orden,\n*${firstName}.*`;
  if (count === 1) return "Una cosa requiere\n*su atención hoy.*";
  return `${int(count)} cosas requieren\n*su atención hoy.*`;
};

/** "Buenas noches, Ana · martes 13 de octubre · cierre de octubre en 18 días". */
export const statusSubtitle = (firstName: string): string => `${greeting()}, ${firstName} · ${monthCloseLine()}`;

/** Lleva la vista hasta el bloque de pendientes. */
export const scrollToPending = () => document.getElementById("pendientes")?.scrollIntoView({ behavior: "smooth", block: "center" });

/** Mismo corte del mes anterior (del 1 al mismo día, o al último si el mes es más corto), para comparar. */
export const previousMonthCut = (todayIso: string): { from: string; to: string } => {
  const [y, m, d] = todayIso.split("-").map(Number) as [number, number, number];
  const prev = new Date(y, m - 2, 1);
  const last = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
  const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  return { from: `${ym}-01`, to: `${ym}-${String(Math.min(d, last)).padStart(2, "0")}` };
};

/** "9 oct" a partir de "2026-10-09", para ejes de fechas. */
export const shortDay = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.getDate()} ${d.toLocaleDateString("es-CO", { month: "short" }).replace(".", "")}`;
};
