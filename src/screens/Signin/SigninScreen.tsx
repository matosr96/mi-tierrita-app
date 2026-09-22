import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignin } from "@/hooks/session";
import { Button, Field, Input } from "@/components/ui";
import styles from "./SigninScreen.module.css";

/** CU-01 Iniciar sesión. */
export const SigninScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const signin = useSignin();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await signin.mutateAsync({ username, password }).then(
      () => navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true }),
      () => undefined,
    );
  };

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <svg width="24" height="24" viewBox="0 0 32 32">
              <path d="M16 25V14M16 14c-4 0-7-3-7-7 4 0 7 3 7 7zm0 0c4 0 7-3 7-7-4 0-7 3-7 7z" fill="none" stroke="#1B4332" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <div className={styles.brandName}>Mi Tierrita</div>
            <div className={styles.brandSub}>Agropecuaria · Sahagún</div>
          </div>
        </div>
        <div className={styles.heroBody}>
          <h1>Sistema de información gerencial</h1>
          <p>Inventario con lotes y vencimientos, punto de venta, cartera, proveedores y evaluación de la ampliación del negocio, con los supuestos a la vista.</p>
        </div>
        <div className={styles.heroFoot}>
          Inventario · Lotes y vencimientos · Ventas
          <br />
          Clientes y cartera · Proveedores · Evaluación de inversiones
        </div>
      </aside>
      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={submit}>
          <h2>Iniciar sesión</h2>
          <Field label="Usuario" htmlFor="username">
            <Input id="username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </Field>
          <Field label="Contraseña" htmlFor="password" error={signin.error?.message}>
            <div style={{ position: "relative" }}>
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required invalid={signin.isError} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: "absolute", right: 8, top: 7, border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)" }} aria-label="Mostrar contraseña">
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </Field>
          <Button type="submit" block loading={signin.isPending}>
            Entrar
          </Button>
          <p className={styles.help}>¿Olvidó su contraseña? Pídale al administrador que la restablezca desde Usuarios y roles.</p>
        </form>
      </section>
    </div>
  );
};
