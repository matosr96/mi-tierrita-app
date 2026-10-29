import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, keys } from "@/hooks/shared";
import { financialService } from "@/services/financial";

/**
 * Elimina un proyecto propio. El proyecto borrado se saca de la caché (no se invalida: pedirlo de nuevo daría 404) y
 * solo se refrescan las listas y la comparación.
 */
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useApiMutation(
    async (id: number) => {
      await financialService.remove(id);
      queryClient.removeQueries({ queryKey: [...keys.financial, "project", id], exact: true });
    },
    { invalidate: [[...keys.financial, "projects"], [...keys.financial, "compare"]], success: "Proyecto eliminado." },
  );
};
