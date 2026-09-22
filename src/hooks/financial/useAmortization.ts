import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/** CU-16. */
export const useAmortization = (id: number | null) =>
  useQuery({ queryKey: [...keys.financial, "amortization", id], queryFn: () => financialService.amortization(id!), enabled: id !== null });
