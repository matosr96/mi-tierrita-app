import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, keys } from "@/hooks/shared";
import { chatService } from "@/services/chat";
import type { ChatAttachment } from "@/types/api";

/** Descarga un adjunto con su nombre original (o lo abre en otra pestaña si es una foto o un PDF). */
export const useDownloadChatAttachment = () => {
  const queryClient = useQueryClient();
  return useApiMutation(async ({ file, open }: { file: ChatAttachment; open?: boolean }) => {
    const blob = await queryClient.fetchQuery({ queryKey: [...keys.chat, "file", file.id], queryFn: () => chatService.attachment(file.id), staleTime: Infinity });
    const url = URL.createObjectURL(blob);
    if (open) {
      window.open(url, "_blank", "noopener");
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return file;
  });
};
