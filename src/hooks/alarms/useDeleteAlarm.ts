import { useApiMutation, keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";

export const useDeleteAlarm = () => useApiMutation((id: number) => alarmsService.remove(id), { invalidate: [keys.alarms], success: "Alarma eliminada." });
