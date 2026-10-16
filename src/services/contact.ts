import { http } from "@/lib/http";
import type { ContactMessage, ContactStatus, Page, PageQuery, SendContactInput } from "@/types/api";

export const contactService = {
  /** Público: formulario de la página pública. */
  send: async (input: SendContactInput): Promise<void> => {
    await http.post("/contact", input);
  },
  list: async (query: PageQuery & { status?: ContactStatus }): Promise<Page<ContactMessage>> => (await http.get<Page<ContactMessage>>("/contact-messages", { params: query })).data,
  setStatus: async (input: { id: number; status: ContactStatus }): Promise<ContactMessage> =>
    (await http.patch<ContactMessage>(`/contact-messages/${input.id}`, { status: input.status })).data,
};
