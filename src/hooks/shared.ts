import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toApiError, type ApiError } from "@/lib/errors";
import { notify } from "@/stores/toasts";

/** Claves de caché por entidad: invalidar la raíz refresca todos los listados de esa entidad. */
export const keys = {
  session: ["session"] as const,
  users: ["users"] as const,
  categories: ["categories"] as const,
  products: ["products"] as const,
  batches: ["batches"] as const,
  suppliers: ["suppliers"] as const,
  customers: ["customers"] as const,
  sales: ["sales"] as const,
  audits: ["audits"] as const,
  reports: ["reports"] as const,
  financial: ["financial"] as const,
};

type MutationOptions<TData> = {
  /** Entidades cuyas consultas quedan obsoletas al terminar con éxito. */
  invalidate?: readonly QueryKey[];
  success?: string | ((data: TData) => string);
  /** Si es false, el error no se notifica globalmente (el formulario lo muestra). */
  notifyError?: boolean;
};

/**
 * Hook base de mutación: ejecuta el servicio, invalida las cachés afectadas y notifica.
 * Los hooks por operación de cada entidad se construyen sobre este.
 */
export const useApiMutation = <TVariables, TData>(fn: (variables: TVariables) => Promise<TData>, options: MutationOptions<TData> = {}) => {
  const queryClient = useQueryClient();
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      try {
        return await fn(variables);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onSuccess: async (data) => {
      for (const key of options.invalidate ?? []) await queryClient.invalidateQueries({ queryKey: key });
      if (options.success !== undefined) notify.success(typeof options.success === "function" ? options.success(data) : options.success);
    },
    onError: (err) => {
      if (options.notifyError !== false) notify.error(err.message);
    },
  });
};
