import { PageHeader } from "@/components/layout/AppShell";
import { Calendar } from "@/components/calendar";
import { Card } from "@/components/ui";
import { useSessionStore } from "@/stores/session";
import type { Role } from "@/types/api";

/** Qué reúne el calendario para cada rol (la API ya filtra los ítems). */
const SUBTITLE: Record<Role, string> = {
  ADMIN: "Lotes por vencer, cobros de cartera, sus alarmas y los cierres de mes, en un solo lugar.",
  SALES: "Cobros de cartera, sus alarmas y los cierres de mes, en un solo lugar.",
  WAREHOUSE: "Lotes por vencer y vencidos, sus alarmas y los cierres de mes, en un solo lugar.",
};

/** Calendario (brief de octubre de 2026, punto 31): todo lo que tiene fecha para el rol, por mes o en agenda. */
export const CalendarScreen = () => {
  const user = useSessionStore((s) => s.user);
  return (
    <>
      <PageHeader title="Calendario" subtitle={user ? SUBTITLE[user.role] : undefined} />
      <Card>
        <Calendar />
      </Card>
    </>
  );
};
