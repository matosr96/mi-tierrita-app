import { http } from "@/lib/http";
import type { CreateCustomerInput, Customer, CustomerBalance, CustomerPayment, CustomerQuery, Page, UpdateCustomerInput } from "@/types/api";

export const customersService = {
  list: async (query: CustomerQuery): Promise<Page<Customer>> => (await http.get<Page<Customer>>("/customers", { params: query })).data,
  get: async (id: number): Promise<Customer> => (await http.get<Customer>(`/customers/${id}`)).data,
  create: async (input: CreateCustomerInput): Promise<Customer> => (await http.post<Customer>("/customers", input)).data,
  update: async (id: number, input: UpdateCustomerInput): Promise<Customer> => (await http.put<Customer>(`/customers/${id}`, input)).data,
  balance: async (id: number, overdueDays?: number): Promise<CustomerBalance> =>
    (await http.get<CustomerBalance>(`/customers/${id}/balance`, { params: { overdueDays } })).data,
  registerPayment: async (id: number, amount: number): Promise<CustomerPayment> => (await http.post<CustomerPayment>(`/customers/${id}/payments`, { amount })).data,
};
