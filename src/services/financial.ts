import { http } from "@/lib/http";
import type { Page, PageQuery, ProjectComparison, ProjectDetail, ProjectScope, ProjectSummary, SimulatorCalculation, SimulatorInput } from "@/types/api";

/** Simulador financiero: la API calcula todas las secciones; la app solo las muestra. */
export const financialService = {
  defaults: async (): Promise<SimulatorCalculation> => (await http.get<SimulatorCalculation>("/financial/simulator/defaults")).data,
  calculate: async (input: SimulatorInput): Promise<SimulatorCalculation> => (await http.post<SimulatorCalculation>("/financial/simulator/calculate", { input })).data,
  projects: async (scope: ProjectScope, query: PageQuery): Promise<Page<ProjectSummary>> =>
    (await http.get<Page<ProjectSummary>>("/financial/projects", { params: { ...query, ...(scope === "all" ? { alcance: "todos" } : {}) } })).data,
  project: async (id: number): Promise<ProjectDetail> => (await http.get<ProjectDetail>(`/financial/projects/${id}`)).data,
  saveAs: async (body: { name: string; input: SimulatorInput }): Promise<ProjectDetail> => (await http.post<ProjectDetail>("/financial/projects", body)).data,
  save: async ({ id, ...body }: { id: number; name?: string; input: SimulatorInput }): Promise<ProjectDetail> => (await http.put<ProjectDetail>(`/financial/projects/${id}`, body)).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/financial/projects/${id}`);
  },
  compare: async (ids: number[]): Promise<{ projects: ProjectComparison[] }> =>
    (await http.get<{ projects: ProjectComparison[] }>("/financial/projects/compare", { params: { ids: ids.join(",") } })).data,
};
