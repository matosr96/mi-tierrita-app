import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation } from "@/hooks/shared";
import { authService } from "@/services/auth";
import { useSessionStore } from "@/stores/session";

/** CU-02: invalida el token en el servidor y limpia la sesión y la caché local. */
export const useSignout = () => {
  const clear = useSessionStore((s) => s.clear);
  const queryClient = useQueryClient();
  return useApiMutation(
    async () => {
      try {
        await authService.signout();
      } finally {
        clear();
        queryClient.clear();
      }
    },
    { notifyError: false },
  );
};
