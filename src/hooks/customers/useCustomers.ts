import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";
import type { CustomerQuery } from "@/types/api";

export const useCustomers = (query: CustomerQuery) => useQuery({ queryKey: [...keys.customers, query], queryFn: () => customersService.list(query), placeholderData: (prev) => prev });
