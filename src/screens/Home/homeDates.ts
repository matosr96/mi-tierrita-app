import { greeting, int, longToday } from "@/lib/format";

/** "Buenos días, Nombre" según la hora. */
export const greetingFor = (firstName: string): string => `${greeting()}, ${firstName}`;

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
