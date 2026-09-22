import { http } from "@/lib/http";
import type { SigninResponse, User } from "@/types/api";

export const authService = {
  signin: async (username: string, password: string): Promise<SigninResponse> => (await http.post<SigninResponse>("/auth/signin", { username, password })).data,
  signout: async (): Promise<void> => {
    await http.post("/auth/signout");
  },
  me: async (): Promise<User> => (await http.get<User>("/auth/me")).data,
};
