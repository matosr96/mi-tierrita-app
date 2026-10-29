import { useState } from "react";
import { Card, Tabs } from "@/components/ui";
import { currentTheme, setTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
  { value: "system", label: "Del dispositivo" },
];

/** Apariencia de la app en este navegador: claro (predeterminado), oscuro o lo que diga el dispositivo. */
export const AppearanceCard = () => {
  const [value, setValue] = useState<ThemePreference>(currentTheme);
  return (
    <Card title="Apariencia" subtitle="Se guarda en este navegador. «Del dispositivo» sigue el modo claro u oscuro del sistema.">
      <Tabs
        ariaLabel="Apariencia"
        value={value}
        options={OPTIONS}
        onChange={(v) => {
          setValue(v);
          setTheme(v);
        }}
      />
    </Card>
  );
};
