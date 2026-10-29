import { useApiMutation, keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";
import type { AlarmInput } from "@/types/api";

export const useUpdateAlarm = () =>
  useApiMutation(({ id, ...input }: AlarmInput & { id: number }) => alarmsService.update(id, input), { invalidate: [keys.alarms], success: "Alarma actualizada.", notifyError: false });
