import { useApiMutation, keys } from "@/hooks/shared";
import { usersService } from "@/services/users";
import { useSessionStore } from "@/stores/session";
import type { UpdateProfileInput } from "@/types/api";

/** Mi perfil: guarda nombre, correo y teléfono propios y refresca el usuario de la sesión. */
export const useUpdateProfile = () => {
  const setUser = useSessionStore((s) => s.setUser);
  const mutation = useApiMutation((input: UpdateProfileInput) => usersService.updateMe(input), { invalidate: [keys.session, keys.users], success: "Perfil actualizado.", notifyError: false });
  return {
    ...mutation,
    mutateAsync: async (input: UpdateProfileInput) => {
      const user = await mutation.mutateAsync(input);
      setUser(user);
      return user;
    },
  };
};
