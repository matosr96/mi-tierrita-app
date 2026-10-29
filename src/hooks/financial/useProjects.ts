import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";
import type { PageQuery, ProjectScope } from "@/types/api";

/** Proyectos guardados del simulador: los propios por omisión o los de todos los administradores. */
export const useProjects = (scope: ProjectScope = "mine", query: PageQuery = { limit: 50 }) =>
  useQuery({ queryKey: [...keys.financial, "projects", scope, query], queryFn: () => financialService.projects(scope, query) });
