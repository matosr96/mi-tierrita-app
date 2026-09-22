import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

export const useScenario = (id: number | null) => useQuery({ queryKey: [...keys.financial, "scenario", id], queryFn: () => financialService.get(id!), enabled: id !== null });
