import { useNavigate, useParams } from "react-router-dom";
import { Tabs, type TabOption } from "@/components/ui";
import { PointOfSale } from "./PointOfSale";
import { SalesHistory } from "./SalesHistory";
import styles from "./SalesScreen.module.css";

type SalesTab = "nueva" | "historial";

const TABS: TabOption<SalesTab>[] = [
  { value: "nueva", label: "Punto de venta" },
  { value: "historial", label: "Historial" },
];

/** CU-09 Registrar venta (punto de venta) y CU-10 Consultar ventas (historial). Rutas /ventas y /ventas/:tab. */
export const SalesScreen = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const current: SalesTab = tab === "historial" ? "historial" : "nueva";
  const tabs = <Tabs options={TABS} value={current} onChange={(v) => navigate(`/ventas/${v}`)} />;

  return <div className={styles.screen}>{current === "nueva" ? <PointOfSale tabs={tabs} /> : <SalesHistory tabs={tabs} />}</div>;
};
