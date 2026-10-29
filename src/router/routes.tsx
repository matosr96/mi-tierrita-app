import type React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { lazy, Suspense } from "react";
import { LandingFallback, LandingScreen, RedirectIfSession, RequireRole, RequireSession } from "./guards";
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
import { ProfileScreen } from "@/screens/Profile/ProfileScreen";
import { ChatScreen } from "@/screens/Chat/ChatScreen";
import { TitaScreen } from "@/screens/Tita/TitaScreen";
import { ContactsScreen } from "@/screens/Contacts/ContactsScreen";
import { LibraryScreen } from "@/screens/Library/LibraryScreen";
import { AlarmsScreen } from "@/screens/Alarms/AlarmsScreen";
import { CalendarScreen } from "@/screens/Calendar/CalendarScreen";
import { OrdersScreen } from "@/screens/Orders/OrdersScreen";
import { PayrollScreen } from "@/screens/Payroll/PayrollScreen";
import { StockCountsScreen } from "@/screens/StockCounts/StockCountsScreen";
import { TitaManualScreen } from "@/screens/Help/TitaManualScreen";
import { NotFoundScreen } from "@/screens/Restricted/RestrictedScreen";

/** Verificación pública de documentos (QR de la portada de los reportes), en su propio paquete. */
const VerifyScreen = lazy(() => import("@/screens/Verify/VerifyScreen").then((m) => ({ default: m.VerifyScreen })));

/** Cada ruta declara qué roles pueden verla (documento 07, sección 5). */
const protectedRoute = (path: string, element: React.ReactElement) => ({
  element: <RequireRole roles={rolesFor(path)} />,
  children: [{ path, element }],
});

export const router = createBrowserRouter([
  {
    path: "/sitio",
    element: (
      <Suspense fallback={<LandingFallback />}>
        <LandingScreen />
      </Suspense>
    ),
  },
  {
    path: "/verificar/:folio",
    element: (
      <Suspense fallback={<LandingFallback />}>
        <VerifyScreen />
      </Suspense>
    ),
  },
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
          protectedRoute("/biblioteca", <LibraryScreen />),
          protectedRoute("/nomina", <PayrollScreen />),
          protectedRoute("/tita", <TitaScreen />),
          protectedRoute("/chat", <ChatScreen />),
          protectedRoute("/contactos", <ContactsScreen />),
          protectedRoute("/alarmas", <AlarmsScreen />),
          protectedRoute("/pedidos", <OrdersScreen />),
          protectedRoute("/calendario", <CalendarScreen />),
          protectedRoute("/conteos", <StockCountsScreen />),
          protectedRoute("/usuarios", <UsersScreen />),
          protectedRoute("/auditoria", <AuditsScreen />),
          // Mi perfil: cualquier rol, fuera del menú (se abre desde el usuario de la barra superior).
          { path: "/perfil", element: <ProfileScreen /> },
          { path: "/perfil/:tab", element: <ProfileScreen /> },
          // Manual de Tita: cualquier rol, fuera del menú (se abre desde Tita).
          { path: "/ayuda/tita", element: <TitaManualScreen /> },
          { path: "/ayuda/tita/:rol", element: <TitaManualScreen /> },
          { path: "*", element: <NotFoundScreen /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
