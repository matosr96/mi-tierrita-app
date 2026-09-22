import type React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RedirectIfSession, RequireRole, RequireSession } from "./guards";
import { rolesFor } from "./navigation";
import { SigninScreen } from "@/screens/Signin/SigninScreen";
import { HomeScreen } from "@/screens/Home/HomeScreen";
import { InventoryScreen } from "@/screens/Inventory/InventoryScreen";
import { BatchesScreen } from "@/screens/Batches/BatchesScreen";
import { SalesScreen } from "@/screens/Sales/SalesScreen";
import { CustomersScreen } from "@/screens/Customers/CustomersScreen";
import { SuppliersScreen } from "@/screens/Suppliers/SuppliersScreen";
import { FinanceScreen } from "@/screens/Finance/FinanceScreen";
import { ReportsScreen } from "@/screens/Reports/ReportsScreen";
import { UsersScreen } from "@/screens/Users/UsersScreen";
import { AuditsScreen } from "@/screens/Audits/AuditsScreen";
import { NotFoundScreen } from "@/screens/Restricted/RestrictedScreen";

/** Cada ruta declara qué roles pueden verla (documento 07, sección 5). */
const protectedRoute = (path: string, element: React.ReactElement) => ({
  element: <RequireRole roles={rolesFor(path)} />,
  children: [{ path, element }],
});

export const router = createBrowserRouter([
  {
    element: <RedirectIfSession />,
    children: [{ path: "/iniciar-sesion", element: <SigninScreen /> }],
  },
  {
    element: <RequireSession />,
    children: [
      {
        element: <AppShell />,
        children: [
          protectedRoute("/", <HomeScreen />),
          protectedRoute("/inventario", <InventoryScreen />),
          protectedRoute("/lotes", <BatchesScreen />),
          { element: <RequireRole roles={rolesFor("/ventas")} />, children: [{ path: "/ventas", element: <SalesScreen /> }, { path: "/ventas/:tab", element: <SalesScreen /> }] },
          protectedRoute("/clientes", <CustomersScreen />),
          protectedRoute("/proveedores", <SuppliersScreen />),
          { element: <RequireRole roles={rolesFor("/finanzas")} />, children: [{ path: "/finanzas", element: <FinanceScreen /> }, { path: "/finanzas/:tab", element: <FinanceScreen /> }] },
          protectedRoute("/reportes", <ReportsScreen />),
          protectedRoute("/usuarios", <UsersScreen />),
          protectedRoute("/auditoria", <AuditsScreen />),
          { path: "*", element: <NotFoundScreen /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
