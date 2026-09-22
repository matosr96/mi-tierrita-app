import { Link } from "react-router-dom";
import { ROLE_LABELS } from "@/stores/session";
import type { Role } from "@/types/api";
import { Button, EmptyState } from "@/components/ui";

/** Pantalla de Acceso restringido (RNF-01): se muestra en vez del contenido, sin pedir datos al backend. */
export const RestrictedScreen = ({ roles }: { roles: Role[] }) => (
  <EmptyState
    title="Acceso restringido"
    text={`Este módulo está disponible para: ${roles.map((r) => ROLE_LABELS[r]).join(", ")}.`}
    action={
      <Link to="/">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    }
  />
);

export const NotFoundScreen = () => (
  <EmptyState
    title="Página no encontrada"
    action={
      <Link to="/">
        <Button variant="secondary">Volver al inicio</Button>
      </Link>
    }
  />
);
