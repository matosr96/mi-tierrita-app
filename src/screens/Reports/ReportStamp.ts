import { createContext, useContext } from "react";

/** Datos de emisión que se conocen al generar el PDF (folio y enlace de verificación); en la vista previa no hay. */
export type ReportStamp = { folio: string; verifyUrl: string; createdAt: string; generatedBy: string } | null;

export const ReportStampContext = createContext<ReportStamp>(null);

/** El folio ya asignado al documento que se está imprimiendo (lo provee `ReportPreview`). */
export const useReportStamp = (): ReportStamp => useContext(ReportStampContext);
