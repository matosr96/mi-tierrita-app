import { useApiMutation, keys } from "@/hooks/shared";
import { usersService } from "@/services/users";
import { useSessionStore } from "@/stores/session";

/** Mi perfil: sube la foto (ya reducida) y refresca el usuario de la sesión para que la barra la muestre al instante. */
export const useUpdateAvatar = () => {
  const setUser = useSessionStore((s) => s.setUser);
  const mutation = useApiMutation((image: Blob) => usersService.updateAvatar(image), { invalidate: [keys.session, keys.users], success: "Foto actualizada." });
  return {
    ...mutation,
    mutateAsync: async (image: Blob) => {
      const user = await mutation.mutateAsync(image);
      setUser(user);
      return user;
    },
  };
};
