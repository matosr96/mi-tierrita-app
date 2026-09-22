import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui";
import { greeting, longToday } from "@/lib/format";
import { useSessionStore } from "@/stores/session";
import { AdminHome } from "./AdminHome";
import { SalesHome } from "./SalesHome";
import { WarehouseHome } from "./WarehouseHome";

/** Inicio: saludo, indicadores y accesos rápidos según el rol activo. */
export const HomeScreen = () => {
  const user = useSessionStore((s) => s.user);
  const navigate = useNavigate();
  if (!user) return null;

  const actions =
    user.role === "ADMIN" ? (
      <>
        <Button variant="secondary" onClick={() => navigate("/lotes")}>
          Entrada de mercancía
        </Button>
        <Button onClick={() => navigate("/ventas/nueva")}>Nueva venta</Button>
      </>
    ) : user.role === "SALES" ? (
      <>
        <Button variant="secondary" onClick={() => navigate("/clientes")}>
          Clientes y cartera
        </Button>
        <Button onClick={() => navigate("/ventas/nueva")}>Nueva venta</Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => navigate("/inventario")}>
          Inventario
        </Button>
        <Button onClick={() => navigate("/lotes")}>Entrada de mercancía</Button>
      </>
    );

  return (
    <>
      <PageHeader title={`${greeting()}, ${user.firstName}`} subtitle={longToday()} actions={actions} />
      {user.role === "ADMIN" ? <AdminHome /> : user.role === "SALES" ? <SalesHome /> : <WarehouseHome />}
    </>
  );
};
