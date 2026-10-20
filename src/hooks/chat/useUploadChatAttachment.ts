import { useMutation } from "@tanstack/react-query";
import { toApiError, type ApiError } from "@/lib/errors";
import { chatService } from "@/services/chat";
import { notify } from "@/stores/toasts";
import type { ChatAttachment } from "@/types/api";

/** Sube un adjunto para el próximo mensaje; avisa con el motivo concreto si el servidor lo rechaza (tipo o tamaño). */
export const useUploadChatAttachment = () =>
  useMutation<ChatAttachment, ApiError, { file: File; onProgress?: (fraction: number) => void }>({
    mutationFn: async ({ file, onProgress }) => {
      try {
        return await chatService.upload(file, onProgress);
      } catch (err) {
        throw toApiError(err);
      }
    },
    onError: (err, { file }) => {
      const detail = Array.isArray(err.details) ? (err.details as { message?: string }[])[0]?.message : undefined;
      notify.error(`${file.name}: ${detail ?? err.message}`);
    },
  });
