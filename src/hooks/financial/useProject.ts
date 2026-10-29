import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

export const useProject = (id: number | null) =>
  useQuery({ queryKey: [...keys.financial, "project", id], queryFn: () => financialService.project(id!), enabled: id !== null });
