import { useApiMutation } from "@/hooks/shared";
import { usersService } from "@/services/users";
import type { ChangePasswordInput } from "@/types/api";

/** CU-04. */
export const useChangePassword = () =>
  useApiMutation((input: ChangePasswordInput) => usersService.changeOwnPassword(input), { success: "Contraseña actualizada.", notifyError: false });
