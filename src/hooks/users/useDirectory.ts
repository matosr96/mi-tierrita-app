import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { usersService } from "@/services/users";

/** Directorio del equipo (rol, contacto y presencia) para la ficha de persona; se refresca cada minuto. */
export const useDirectory = () => useQuery({ queryKey: [...keys.users, "directory"], queryFn: usersService.directory, staleTime: 60_000, refetchInterval: 60_000 });
