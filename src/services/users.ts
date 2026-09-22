import { http } from "@/lib/http";
import type { ChangePasswordInput, CreateUserInput, Page, PageQuery, User } from "@/types/api";

export const usersService = {
  list: async (query: PageQuery): Promise<Page<User>> => (await http.get<Page<User>>("/users", { params: query })).data,
  get: async (id: number): Promise<User> => (await http.get<User>(`/users/${id}`)).data,
  create: async (input: CreateUserInput): Promise<User> => (await http.post<User>("/users", input)).data,
  changeOwnPassword: async (input: ChangePasswordInput): Promise<void> => {
    await http.put("/users/me/password", input);
  },
};
