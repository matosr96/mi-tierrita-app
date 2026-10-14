import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "@/stores/session";
import type { Role } from "@/types/api";
import { RestrictedScreen } from "@/screens/Restricted/RestrictedScreen";

/** Guarda de sesión: sin token redirige a Iniciar sesión. */
export const RequireSession = () => {
  const token = useSessionStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />;
  return <Outlet />;
};

/** Guarda de rol: muestra Acceso restringido sin llegar a pedir datos al backend (RNF-01). */
export const RequireRole = ({ roles }: { roles: Role[] }) => {
  const user = useSessionStore((s) => s.user);
  if (!user || !roles.includes(user.role)) return <RestrictedScreen roles={roles} />;
  return <Outlet />;
};

/**
 * Con sesión activa al llegar, Iniciar sesión redirige al inicio. Si la sesión nace aquí mismo (el usuario acaba de
 * entrar), no se redirige: la pantalla termina su salida animada y navega ella misma.
 */
export const RedirectIfSession = () => {
  const [hadSession] = useState(() => Boolean(useSessionStore.getState().token));
  if (hadSession) return <Navigate to="/" replace />;
  return <Outlet />;
};
