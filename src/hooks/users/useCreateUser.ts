import { useApiMutation, keys } from "@/hooks/shared";
import { usersService } from "@/services/users";
import type { CreateUserInput } from "@/types/api";

/** CU-03. */
export const useCreateUser = () =>
  useApiMutation((input: CreateUserInput) => usersService.create(input), { invalidate: [keys.users], success: "Usuario creado.", notifyError: false });
