import { useApiMutation } from "@/hooks/shared";
import { aiService } from "@/services/ai";

/** Lee la foto de una factura (JPEG en base64) y la cruza con el catálogo. No registra nada. */
export const useReadInvoice = () => useApiMutation((image: string) => aiService.readInvoice(image, "image/jpeg"), { notifyError: false });
