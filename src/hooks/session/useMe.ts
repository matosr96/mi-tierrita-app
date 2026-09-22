import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { authService } from "@/services/auth";
import { useSessionStore } from "@/stores/session";

/** Revalida los datos del usuario autenticado contra el servidor. */
export const useMe = () => {
  const token = useSessionStore((s) => s.token);
  return useQuery({ queryKey: [...keys.session, "me"], queryFn: authService.me, enabled: token !== null, staleTime: 5 * 60_000 });
};
