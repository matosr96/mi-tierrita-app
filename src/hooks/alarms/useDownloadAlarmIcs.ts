import { useApiMutation } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";

/** Descarga el .ics de una alarma (`alarma-<id>.ics`) o de todas las activas, para agregarlas al calendario del teléfono. */
export const useDownloadAlarmIcs = () =>
  useApiMutation(async (id: number | "all") => {
    const blob = await alarmsService.ics(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = id === "all" ? "alarmas-mi-tierrita.ics" : `alarma-${id}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
