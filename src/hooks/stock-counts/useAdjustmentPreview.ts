import { useQuery } from "@tanstack/react-query";
import { stockCountsService } from "@/services/stockCounts";

/**
 * Vista previa del ajuste contra el stock actual. Clave con raíz propia (fuera de `keys.stockCounts`) y sin caché: invalidar los conteos
 * al aplicar no debe volver a pedirla (un conteo ya aplicado responde 711) y cada apertura trae el stock del momento.
 */
export const useAdjustmentPreview = (id: number | null) =>
  useQuery({ queryKey: ["stockCountPreview", id], queryFn: () => stockCountsService.previewAdjustment(id!), enabled: id !== null, staleTime: 0, gcTime: 0 });
