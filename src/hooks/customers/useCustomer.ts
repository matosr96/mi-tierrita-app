import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { customersService } from "@/services/customers";

export const useCustomer = (id: number | null) => useQuery({ queryKey: [...keys.customers, id], queryFn: () => customersService.get(id!), enabled: id !== null });
