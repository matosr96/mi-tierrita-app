import type { ReactNode } from "react";
import { StatCard } from "@/components/ui";

type QueryLike<T> = { data: T | undefined; isPending: boolean; isError: boolean };
type Tone = "neutral" | "good" | "warn" | "bad";
type Props<T> = { query: QueryLike<T>; label: string; value: (data: T) => ReactNode; hint?: (data: T) => ReactNode; tone?: (data: T) => Tone };

/** Tarjeta de indicador ligada a una consulta: cada bloque del inicio carga y falla por su cuenta. */
export const QueryStat = <T,>({ query, label, value, hint, tone }: Props<T>) => {
  if (query.isPending) return <StatCard label={label} value="…" hint="Cargando" />;
  if (query.isError || query.data === undefined) return <StatCard label={label} value="—" hint="No disponible" />;
  const data = query.data;
  return <StatCard label={label} value={value(data)} hint={hint?.(data)} tone={tone?.(data) ?? "neutral"} />;
};
