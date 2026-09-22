import { useSessionStore } from "@/stores/session";
import { AdminHome } from "./AdminHome";
import { SalesHome } from "./SalesHome";
import { WarehouseHome } from "./WarehouseHome";

/** Inicio: cada rol tiene su propia vista del lienzo (Dashboard, SecInicio, BodInicio). */
export const HomeScreen = () => {
  const user = useSessionStore((s) => s.user);
  if (!user) return null;
  if (user.role === "ADMIN") return <AdminHome user={user} />;
  if (user.role === "SALES") return <SalesHome user={user} />;
  return <WarehouseHome user={user} />;
};
