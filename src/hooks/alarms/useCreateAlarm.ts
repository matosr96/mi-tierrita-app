import { useApiMutation, keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";
import type { AlarmInput } from "@/types/api";

/** El formulario muestra los errores de validación campo a campo. */
export const useCreateAlarm = () => useApiMutation((input: AlarmInput) => alarmsService.create(input), { invalidate: [keys.alarms], success: "Alarma creada.", notifyError: false });
