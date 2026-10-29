import { useRef, useState } from "react";
import { Button, UserAvatar } from "@/components/ui";
import { useRemoveAvatar, useUpdateAvatar } from "@/hooks/users";
import { avatarImage } from "@/lib/attachments";
import type { User } from "@/types/api";
import styles from "./ProfileScreen.module.css";

/** Mi perfil · foto: la actual (o las iniciales), «Cambiar foto» (se reduce a 256×256 en el navegador) y «Quitar foto». */
export const AvatarEditor = ({ user }: { user: User }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useUpdateAvatar();
  const remove = useRemoveAvatar();
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = update.isPending || remove.isPending;

  const onPick = async (file: File | null) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setLocalError(null);
    try {
      await update.mutateAsync(await avatarImage(file));
    } catch (err) {
      // Un error del servidor ya se notificó con un toast; aquí solo los de procesar la imagen.
      if (err instanceof Error && !("code" in err)) setLocalError(err.message);
    }
  };

  return (
    <div className={styles.avatarBlock}>
      <UserAvatar user={user} size={72} className={styles.avatar} />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className={styles.avatarInput} aria-label="Elegir foto de perfil" onChange={(e) => void onPick(e.target.files?.[0] ?? null)} />
      <div className={styles.avatarActions}>
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} loading={update.isPending} disabled={busy}>
          {user.hasAvatar ? "Cambiar foto" : "Subir foto"}
        </Button>
        {user.hasAvatar ? (
          <Button size="sm" variant="ghost" onClick={() => void remove.mutateAsync()} loading={remove.isPending} disabled={busy}>
            Quitar foto
          </Button>
        ) : null}
      </div>
      {localError ? (
        <span className={styles.avatarError} role="alert">
          {localError}
        </span>
      ) : null}
    </div>
  );
};
