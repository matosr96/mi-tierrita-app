import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { usersService } from "@/services/users";
import type { PageQuery } from "@/types/api";

export const useUsers = (query: PageQuery) => useQuery({ queryKey: [...keys.users, query], queryFn: () => usersService.list(query) });
