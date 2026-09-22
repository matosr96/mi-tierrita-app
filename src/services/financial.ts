import { http } from "@/lib/http";
import type { Amortization, Bivariate, CreateScenarioInput, Page, PageQuery, Range, ScenarioDetail, ScenarioSummary, Sensitivity, SensitivityVariable, Tornado } from "@/types/api";

export const financialService = {
  list: async (query: PageQuery): Promise<Page<ScenarioSummary>> => (await http.get<Page<ScenarioSummary>>("/financial/scenarios", { params: query })).data,
  get: async (id: number): Promise<ScenarioDetail> => (await http.get<ScenarioDetail>(`/financial/scenarios/${id}`)).data,
  create: async (input: CreateScenarioInput): Promise<ScenarioDetail> => (await http.post<ScenarioDetail>("/financial/scenarios", input)).data,
  compare: async (ids: number[]): Promise<{ scenarios: ScenarioSummary[] }> =>
    (await http.get<{ scenarios: ScenarioSummary[] }>("/financial/scenarios/compare", { params: { ids: ids.join(",") } })).data,
  amortization: async (id: number): Promise<Amortization> => (await http.get<Amortization>(`/financial/scenarios/${id}/amortization`)).data,
  sensitivity: async (id: number, variable: SensitivityVariable, range?: Range): Promise<Sensitivity> =>
    (await http.get<Sensitivity>(`/financial/scenarios/${id}/sensitivity`, { params: { variable, ...range } })).data,
  bivariate: async (id: number, varX: SensitivityVariable, varY: SensitivityVariable): Promise<Bivariate> =>
    (await http.get<Bivariate>(`/financial/scenarios/${id}/sensitivity/bivariate`, { params: { varX, varY } })).data,
  tornado: async (id: number): Promise<Tornado> => (await http.get<Tornado>(`/financial/scenarios/${id}/tornado`)).data,
};
