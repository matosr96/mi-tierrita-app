import { useEffect, useState } from "react";
import { useUserAvatar } from "@/hooks/users/useUserAvatar";
import { initials } from "@/lib/format";
import styles from "./UserAvatar.module.css";

export type UserAvatarUser = { id: number; firstName: string; lastName: string; hasAvatar?: boolean | undefined; avatarUpdatedAt?: string | null | undefined };

type Props = { user: UserAvatarUser; size?: number; className?: string };

/**
 * Foto de perfil de una persona o, si no tiene, sus iniciales con el mismo estilo de siempre. La foto se descarga con
 * la sesión (`GET /users/:id/avatar`) y queda en caché por `avatarUpdatedAt`; `className` permite al contenedor
 * (barra, tarjeta) conservar su color y tamaño propios para las iniciales.
 */
export const UserAvatar = ({ user, size = 36, className }: Props) => {
  const has = user.hasAvatar === true;
  const blob = useUserAvatar(user.id, user.avatarUpdatedAt, { enabled: has });
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob.data) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob.data);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob.data]);
  const name = `${user.firstName} ${user.lastName}`;
  return (
    <span className={[styles.avatar, className ?? ""].join(" ")} style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.36)) }} role="img" aria-label={name} title={name}>
      {has && url ? <img src={url} alt="" /> : initials(user.firstName, user.lastName)}
    </span>
  );
};
