import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { alarmsService } from "@/services/alarms";

export const useAlarm = (id: number | null) =>
  useQuery({ queryKey: [...keys.alarms, "one", id], queryFn: () => alarmsService.get(id as number), enabled: id !== null });
