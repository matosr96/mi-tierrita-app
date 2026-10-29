import { useApiMutation, keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";

/** Interruptor activar/apagar. */
export const useSetAlarmActive = () =>
  useApiMutation(({ id, active }: { id: number; active: boolean }) => alarmsService.setActive(id, active), { invalidate: [keys.alarms], success: (a) => (a.active ? "Alarma activada." : "Alarma apagada.") });
