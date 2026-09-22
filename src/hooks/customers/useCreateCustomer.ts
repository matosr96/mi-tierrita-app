import { useApiMutation, keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";
import type { CreateCustomerInput } from "@/types/api";

export const useCreateCustomer = () =>
  useApiMutation((input: CreateCustomerInput) => customersService.create(input), { invalidate: [keys.customers], success: "Cliente creado.", notifyError: false });
