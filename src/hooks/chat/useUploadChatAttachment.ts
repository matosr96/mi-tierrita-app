import { useMutation } from "@tanstack/react-query";
import { toApiError, type ApiError } from "@/lib/errors";
import { chatService } from "@/services/chat";
import { notify } from "@/stores/toasts";
import type { ChatAttachment } from "@/types/api";

/** Sube un adjunto para el próximo mensaje (`durationMs` en notas de voz); avisa con el motivo concreto si el servidor lo rechaza. */
export const useUploadChatAttachment = () =>
  useMutation<ChatAttachment, ApiError, { file: File; onProgress?: (fraction: number) => void; durationMs?: number }>({
    mutationFn: async ({ file, onProgress, durationMs }) => {
      try {
        return await chatService.upload(file, onProgress, durationMs);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onError: (err, { file }) => {
      const detail = Array.isArray(err.details) ? (err.details as { message?: string }[])[0]?.message : undefined;
      notify.error(`${file.name}: ${detail ?? err.message}`);
    },
  });
