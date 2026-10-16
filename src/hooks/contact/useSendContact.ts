import { useApiMutation } from "@/hooks/shared";
import { contactService } from "@/services/contact";
import type { SendContactInput } from "@/types/api";

/** Formulario de la página pública: deja el mensaje en la bandeja de la tienda. */
export const useSendContact = () => useApiMutation((input: SendContactInput) => contactService.send(input), { notifyError: false });
