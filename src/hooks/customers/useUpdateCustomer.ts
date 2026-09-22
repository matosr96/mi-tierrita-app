import { useApiMutation, keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";
import type { UpdateCustomerInput } from "@/types/api";

export const useUpdateCustomer = () =>
  useApiMutation(({ id, ...input }: UpdateCustomerInput & { id: number }) => customersService.update(id, input), {
    invalidate: [keys.customers, keys.reports],
    success: "Cliente actualizado.",
    notifyError: false,
  });
