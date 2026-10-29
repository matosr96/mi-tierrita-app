/** «Activo ahora» o «Últ. vez hace 2 h» (mismo texto que el panel del chat), a partir de la última conexión. */
export const presenceText = (online: boolean, lastSeenAt: string | null, now: number = Date.now()): string => {
  if (online) return "Activo ahora";
  if (!lastSeenAt) return "Sin conexión reciente";
  const mins = Math.max(0, Math.floor((now - Date.parse(lastSeenAt)) / 60_000));
  if (mins < 1) return "Últ. vez hace un momento";
  if (mins < 60) return `Últ. vez hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Últ. vez hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Últ. vez hace ${days} ${days === 1 ? "día" : "días"}`;
};
