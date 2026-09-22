import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/** CU-17 tornado. */
export const useTornado = (id: number | null) => useQuery({ queryKey: [...keys.financial, "tornado", id], queryFn: () => financialService.tornado(id!), enabled: id !== null });
