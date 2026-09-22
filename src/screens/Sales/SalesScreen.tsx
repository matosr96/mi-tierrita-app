import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/AppShell";
import { Tabs, type TabOption } from "@/components/ui";
import { PointOfSale } from "./PointOfSale";
import { SalesHistory } from "./SalesHistory";
import styles from "./SalesScreen.module.css";

type SalesTab = "nueva" | "historial";

const TABS: TabOption<SalesTab>[] = [
  { value: "nueva", label: "Punto de venta" },
  { value: "historial", label: "Historial" },
];

const SUBTITLES: Record<SalesTab, string> = {
  nueva: "Los productos descuentan del inventario al confirmar.",
  historial: "Cada venta queda asociada al usuario que la registró.",
};

/** CU-09 Registrar venta (punto de venta) y CU-10 Consultar ventas (historial). Rutas /ventas y /ventas/:tab. */
export const SalesScreen = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const current: SalesTab = tab === "historial" ? "historial" : "nueva";

  return (
    <div className={styles.screen}>
      <PageHeader title="Ventas" subtitle={SUBTITLES[current]} actions={<Tabs options={TABS} value={current} onChange={(v) => navigate(`/ventas/${v}`)} />} />
      {current === "nueva" ? <PointOfSale /> : <SalesHistory />}
    </div>
  );
};
