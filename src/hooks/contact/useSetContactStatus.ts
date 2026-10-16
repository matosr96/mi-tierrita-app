import { useApiMutation, keys } from "@/hooks/shared";
import { contactService } from "@/services/contact";
import type { ContactStatus } from "@/types/api";

/** Marca un contacto como leído, archivado o nuevo. */
export const useSetContactStatus = () =>
  useApiMutation((input: { id: number; status: ContactStatus }) => contactService.setStatus(input), { invalidate: [keys.contact] });
