import { useApiMutation } from "@/hooks/shared";
import { aiService } from "@/services/ai";
import type { AiDraftRequest } from "@/types/api";

/** Borrador de texto redactado con datos reales (mensaje de cobro, respuesta, resumen, explicación). */
export const useAiDraft = () => useApiMutation((input: AiDraftRequest) => aiService.draft(input), { notifyError: false });
