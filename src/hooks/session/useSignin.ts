import { useApiMutation } from "@/hooks/shared";
import { authService } from "@/services/auth";
import { useSessionStore } from "@/stores/session";

/** CU-01: inicia sesión y guarda token y usuario en el estado global. El formulario muestra el error. */
export const useSignin = () => {
  const signin = useSessionStore((s) => s.signin);
  return useApiMutation(
    async ({ username, password }: { username: string; password: string }) => {
      const result = await authService.signin(username, password);
      signin(result.token, result.user);
      return result;
    },
    { notifyError: false },
  );
};
