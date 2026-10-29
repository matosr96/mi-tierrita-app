import { http } from "@/lib/http";
import type { DirectoryEntry, ChangePasswordInput, CreateUserInput, Page, PageQuery, UpdateProfileInput, User } from "@/types/api";

export const usersService = {
  list: async (query: PageQuery): Promise<Page<User>> => (await http.get<Page<User>>("/users", { params: query })).data,
  get: async (id: number): Promise<User> => (await http.get<User>(`/users/${id}`)).data,
  directory: async (): Promise<DirectoryEntry[]> => (await http.get<DirectoryEntry[]>("/users/directory")).data,
  create: async (input: CreateUserInput): Promise<User> => (await http.post<User>("/users", input)).data,
  updateMe: async (input: UpdateProfileInput): Promise<User> => (await http.put<User>("/users/me", input)).data,
  changeOwnPassword: async (input: ChangePasswordInput): Promise<void> => {
    await http.put("/users/me/password", input);
  },
  /** Foto de perfil: cuerpo binario JPEG/PNG/WebP (la app la reduce a 256×256 antes). */
  updateAvatar: async (image: Blob): Promise<User> => (await http.put<User>("/users/me/avatar", image, { headers: { "Content-Type": image.type }, timeout: 60_000 })).data,
  removeAvatar: async (): Promise<User> => (await http.delete<User>("/users/me/avatar")).data,
  /** La foto de una persona, con la sesión (un <img> no puede mandar el token). */
  avatar: async (id: number): Promise<Blob> => (await http.get<Blob>(`/users/${id}/avatar`, { responseType: "blob" })).data,
};
