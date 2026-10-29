/** Formato de presentación. El frontend nunca calcula: solo muestra lo que devuelve la API. */
const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("es-CO", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : cop.format(value));

/** $ 10,7 M para tarjetas de indicador. */
export const moneyCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$ ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(abs / 1_000_000)} M`;
  return `${sign}$ ${integer.format(abs)}`;
};

export const int = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : integer.format(value));
/** Hasta un decimal y sin ceros sobrantes: "1", "2,5" (ritmos de venta, promedios cortos). */
export const num1 = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : value.toLocaleString("es-CO", { maximumFractionDigits: 1 }));
export const num2 = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : decimal.format(value));
export const pct = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : percent.format(value));
export const years = (value: number | null | undefined): string => (value === null || value === undefined ? "no se recupera" : `${decimal.format(value)} años`);
export const times = (value: number | null | undefined): string => (value === null || value === undefined ? "—" : `${decimal.format(value)} ×`);

export const dateTime = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "—";
export const dateOnly = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", { dateStyle: "medium" });
};
/** Fecha de hoy YYYY-MM-DD en la hora local del equipo (no en UTC: a las 8 p. m. en Colombia sigue siendo hoy). */
export const todayIso = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDaysIso = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const longToday = (): string =>
  new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, (c) => c.toUpperCase());
/** Fecha YYYY-MM-DD como Date local al mediodía (sin corrimientos por zona horaria). */
const localNoon = (iso: string): Date => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
};
const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
/** «Octubre de 2026» a partir de cualquier día del mes. */
export const monthYear = (iso: string): string => capitalize(localNoon(iso).toLocaleDateString("es-CO", { month: "long", year: "numeric" }));
/** «jueves, 29 de octubre de 2026» (rótulos accesibles de un día). */
export const dayLong = (iso: string): string => localNoon(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
/** «Jueves, 29 de octubre» (encabezado de un día en una agenda). */
export const dayHeading = (iso: string): string => capitalize(localNoon(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));
export const greeting = (): string => {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches";
};
export const initials = (first: string, last: string): string => `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
