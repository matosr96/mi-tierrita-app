import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";

/** RF-04.4. */
export const useCustomerBalance = (id: number | null) =>
  useQuery({ queryKey: [...keys.customers, id, "balance"], queryFn: () => customersService.balance(id!), enabled: id !== null });
