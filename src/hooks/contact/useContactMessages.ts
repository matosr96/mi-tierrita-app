import { useQuery } from "@tanstack/react-query";
import { keys } from "@/hooks/shared";
import { contactService } from "@/services/contact";
import type { ContactStatus, PageQuery } from "@/types/api";

/** Bandeja de contactos del sitio (solo administración). */
export const useContactMessages = (query: PageQuery & { status?: ContactStatus }, options: { enabled?: boolean } = {}) =>
  useQuery({ queryKey: [...keys.contact, query], queryFn: () => contactService.list(query), placeholderData: (prev) => prev, enabled: options.enabled ?? true });
