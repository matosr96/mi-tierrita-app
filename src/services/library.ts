import { http } from "@/lib/http";
import type { CreateLinkInput, LibraryItem, LibraryQuery, Page, UpdateLibraryItemInput, UploadLibraryDocumentInput } from "@/types/api";

export const libraryService = {
  list: async (query: LibraryQuery): Promise<Page<LibraryItem>> => (await http.get<Page<LibraryItem>>("/library", { params: query })).data,
  createLink: async (input: CreateLinkInput): Promise<LibraryItem> => (await http.post<LibraryItem>("/library/links", input)).data,
  /** El archivo va como cuerpo binario (igual que los adjuntos del chat); título, descripción y roles en cabeceras codificadas. */
  uploadDocument: async ({ file, title, description, roles, onProgress }: UploadLibraryDocumentInput): Promise<LibraryItem> =>
    (
      await http.post<LibraryItem>("/library/documents", file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-File-Name": encodeURIComponent(file.name),
          "X-Title": encodeURIComponent(title),
          "X-Description": encodeURIComponent(description ?? ""),
          "X-Roles": encodeURIComponent((roles ?? []).join(",")),
        },
        timeout: 120_000,
        onUploadProgress: (e) => (onProgress && e.total ? onProgress(e.loaded / e.total) : undefined),
      })
    ).data,
  update: async (id: number, input: UpdateLibraryItemInput): Promise<LibraryItem> => (await http.put<LibraryItem>(`/library/${id}`, input)).data,
  remove: async (id: number): Promise<void> => {
    await http.delete(`/library/${id}`);
  },
  /** El archivo con la sesión (un <iframe> o un <img> no pueden mandar el token). */
  file: async (id: number): Promise<Blob> => (await http.get<Blob>(`/library/${id}/file`, { responseType: "blob", timeout: 120_000 })).data,
};
