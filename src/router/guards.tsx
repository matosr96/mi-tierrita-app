import { lazy, Suspense, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "@/stores/session";
import type { Role } from "@/types/api";
import { RestrictedScreen } from "@/screens/Restricted/RestrictedScreen";

/** Página pública, en su propio paquete (solo se descarga para quien la abre). */
export const LandingScreen = lazy(() => import("@/screens/Landing/LandingScreen").then((m) => ({ default: m.LandingScreen })));

/** Fondo mientras llega el paquete de la página pública. */
export const LandingFallback = () => <div style={{ minHeight: "100vh", background: "var(--surface)" }} />;

/** Guarda de sesión: sin token, la raíz muestra la página pública y el resto redirige a Iniciar sesión. */
export const RequireSession = () => {
  const token = useSessionStore((s) => s.token);
  const location = useLocation();
  if (!token && location.pathname === "/") {
    return (
      <Suspense fallback={<LandingFallback />}>
        <LandingScreen />
      </Suspense>
    );
  }
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
 * entrar), no se redirige: la pantalla de inicio de sesión navega ella misma al terminar.
 */
export const RedirectIfSession = () => {
  const [hadSession] = useState(() => Boolean(useSessionStore.getState().token));
  if (hadSession) return <Navigate to="/" replace />;
  return <Outlet />;
};
