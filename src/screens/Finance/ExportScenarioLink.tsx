import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { projectReportPath } from "./simShared";

type Props = { projectId: number | null; /** Hay cambios sin guardar: el informe lee el cálculo guardado, así que no hay qué exportar todavía. */ dirty: boolean; size?: "sm" | "md" };

/** «Exportar escenario»: atajo a Reportes → Informe del proyecto con este escenario elegido. Sin lógica propia. */
export const ExportScenarioLink = ({ projectId, dirty, size = "md" }: Props) => {
  const navigate = useNavigate();
  return (
    <Button
      variant="secondary"
      size={size}
      disabled={dirty}
      title={dirty ? "Guarde el proyecto para exportarlo: el informe usa el cálculo guardado" : "Abre Reportes → Informe del proyecto con este escenario"}
      onClick={() => navigate(projectReportPath(projectId))}
    >
      Exportar escenario
    </Button>
  );
};
