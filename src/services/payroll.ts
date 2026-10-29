import { http } from "@/lib/http";
import type {
  CreatePayrollEmployeeInput,
  CreatePayrollPeriodInput,
  Page,
  PayrollEmployee,
  PayrollEmployeeQuery,
  PayrollPeriod,
  PayrollPeriodDetail,
  PayrollPeriodQuery,
  UpdatePayrollEmployeeInput,
  UpdatePayrollLineInput,
} from "@/types/api";

/** Nómina simplificada (solo ADMIN). Los totales y la liquidación los calcula la API. */
export const payrollService = {
  listEmployees: async (query: PayrollEmployeeQuery): Promise<Page<PayrollEmployee>> =>
    (await http.get<Page<PayrollEmployee>>("/payroll/employees", { params: query })).data,
  createEmployee: async (input: CreatePayrollEmployeeInput): Promise<PayrollEmployee> => (await http.post<PayrollEmployee>("/payroll/employees", input)).data,
  updateEmployee: async (id: number, input: UpdatePayrollEmployeeInput): Promise<PayrollEmployee> =>
    (await http.put<PayrollEmployee>(`/payroll/employees/${id}`, input)).data,
  listPeriods: async (query: PayrollPeriodQuery): Promise<Page<PayrollPeriod>> => (await http.get<Page<PayrollPeriod>>("/payroll/periods", { params: query })).data,
  getPeriod: async (id: number): Promise<PayrollPeriodDetail> => (await http.get<PayrollPeriodDetail>(`/payroll/periods/${id}`)).data,
  createPeriod: async (input: CreatePayrollPeriodInput): Promise<PayrollPeriodDetail> => (await http.post<PayrollPeriodDetail>("/payroll/periods", input)).data,
  updateLine: async (periodId: number, lineId: number, input: UpdatePayrollLineInput): Promise<PayrollPeriodDetail> =>
    (await http.put<PayrollPeriodDetail>(`/payroll/periods/${periodId}/lines/${lineId}`, input)).data,
  approvePeriod: async (id: number): Promise<PayrollPeriodDetail> => (await http.post<PayrollPeriodDetail>(`/payroll/periods/${id}/approve`)).data,
  payPeriod: async (id: number): Promise<PayrollPeriodDetail> => (await http.post<PayrollPeriodDetail>(`/payroll/periods/${id}/pay`)).data,
  removePeriod: async (id: number): Promise<void> => {
    await http.delete(`/payroll/periods/${id}`);
  },
};
