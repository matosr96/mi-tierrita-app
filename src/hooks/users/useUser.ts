import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { usersService } from "@/services/users";

export const useUser = (id: number | null) => useQuery({ queryKey: [...keys.users, id], queryFn: () => usersService.get(id!), enabled: id !== null });
