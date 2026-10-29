import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { usersService } from "@/services/users";

/** La foto de una persona, en caché por `avatarUpdatedAt` (cambia cuando la persona la reemplaza). */
export const useUserAvatar = (id: number, avatarUpdatedAt: string | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: [...keys.users, "avatar", id, avatarUpdatedAt ?? null],
    queryFn: () => usersService.avatar(id),
    enabled: options.enabled ?? true,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
  });
