import axios from "axios";
import { useSessionStore } from "@/stores/session";

/**
 * Cliente HTTP único (documento 02): adjunta el token de sesión y, ante un 401,
 * cierra la sesión local para que la guarda de navegación redirija a Iniciar sesión.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 20_000,
});

http.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.endsWith("/auth/signin")) {
      useSessionStore.getState().clear();
    }
    return Promise.reject(error);
  },
);
