import { useApiMutation, keys } from "@/hooks/shared";
import { usersService } from "@/services/users";
import { useSessionStore } from "@/stores/session";

/** Mi perfil: quita la foto (vuelven las iniciales) y refresca el usuario de la sesión. */
export const useRemoveAvatar = () => {
  const setUser = useSessionStore((s) => s.setUser);
  const mutation = useApiMutation(() => usersService.removeAvatar(), { invalidate: [keys.session, keys.users], success: "Foto quitada." });
  return {
    ...mutation,
    mutateAsync: async () => {
      const user = await mutation.mutateAsync(undefined as void);
      setUser(user);
      return user;
    },
  };
};
