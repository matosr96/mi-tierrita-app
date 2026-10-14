import { useEffect, useState, type FormEvent, type PointerEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSignin } from "@/hooks/session";
import { Button, Field, Input } from "@/components/ui";
import { BrandMark } from "@/components/layout/AppShell";
import { SplitText, TopoField } from "@/components/motion";
import styles from "./SigninScreen.module.css";

const Eye = ({ off }: { off: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 20" fill="none" aria-hidden="true">
    <path d="M1.8 10 C 4.9 5.2 8.5 3 12 3 C 15.5 3 19.1 5.2 22.2 10 C 19.1 14.8 15.5 17 12 17 C 8.5 17 4.9 14.8 1.8 10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="3.1" stroke="currentColor" strokeWidth="1.5" />
    {off ? <line x1="3.4" y1="1.6" x2="20.6" y2="18.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /> : null}
  </svg>
);

const MODULES = ["Inventario", "Lotes y vencimientos", "Ventas", "Clientes y cartera", "Proveedores", "Evaluación de inversiones"];

const clock = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/** CU-01 Iniciar sesión: portada cinematográfica con curvas de nivel animadas y formulario de vidrio. */
export const SigninScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [now, setNow] = useState(clock);
  const [leaving, setLeaving] = useState(false);
  const signin = useSignin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = window.setInterval(() => setNow(clock()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // El resplandor sigue al cursor.
  const follow = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty("--mx", `${e.clientX}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY}px`);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await signin.mutateAsync({ username, password }).then(
      () => {
        // Salida animada antes de entrar al sistema (sin espera si el usuario pidió reducir el movimiento).
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        setLeaving(true);
        window.setTimeout(() => navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true }), reduced ? 0 : 750);
      },
      () => undefined,
    );
  };

  return (
    <div className={[styles.page, leaving ? styles.leaving : ""].join(" ")} onPointerMove={follow}>
      <div className={styles.bg} aria-hidden="true">
        <TopoField className={styles.topo} />
        <div className={styles.glow} />
        <div className={styles.spot} />
        <div className={styles.grain} />
      </div>

      <div className={styles.frame}>
        <span className={[styles.corner, styles.tl].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.tr].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.bl].join(" ")} aria-hidden="true" />
        <span className={[styles.corner, styles.br].join(" ")} aria-hidden="true" />

        <header className={styles.top}>
          <div className={styles.brand}>
            <BrandMark size={34} />
            <div>
              <div className={styles.brandName}>Mi Tierrita</div>
              <div className={styles.brandSub}>Agropecuaria · Sahagún</div>
            </div>
          </div>
          <div className={styles.coords}>8.95° N · 75.44° O</div>
          <div className={styles.clock}>
            <span className={styles.live} aria-hidden="true" />
            {now}
          </div>
        </header>

        <div className={styles.body}>
          <section className={styles.hero}>
            <div className={styles.eyebrow}>
              <span>01</span>
              <span className={styles.rule} />
              Acceso al sistema
            </div>
            <h1 className={styles.headline}>
              <SplitText text={"Cada lote,\ncada venta,\n*a la vista.*"} delay={250} stagger={70} />
            </h1>
            <p className={styles.lead}>Inventario, cartera y evaluación de inversiones en un solo lugar: calcula si un crédito crea valor y si el negocio puede pagar la cuota, con los supuestos a la vista.</p>
            <ol className={styles.modules}>
              {MODULES.map((m, i) => (
                <li key={m} style={{ animationDelay: `${900 + i * 70}ms` }}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {m}
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.formSide}>
            <form className={styles.form} onSubmit={submit}>
              <div className={styles.formHead}>
                <span className={styles.formTag}>Sesión segura</span>
                <h2>Iniciar sesión</h2>
                <p>Use el usuario que le asignó el administrador.</p>
              </div>
              <Field label="Usuario" htmlFor="username">
                <Input id="username" className={styles.input} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
              </Field>
              <Field label="Contraseña" htmlFor="password" error={signin.error?.message}>
                <div className={[styles.passwordWrap, signin.isError ? styles.passwordWrapError : ""].join(" ")}>
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className={styles.eye} onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    <Eye off={showPassword} />
                  </button>
                </div>
              </Field>
              <Button type="submit" variant="accent" size="lg" block loading={signin.isPending}>
                Entrar
              </Button>
              <p className={styles.help}>¿Olvidó su contraseña? Pídale al administrador que la restablezca desde Usuarios y roles.</p>
            </form>
          </section>
        </div>

        <footer className={styles.foot}>
          <span>© {new Date().getFullYear()} Mi Tierrita SIG</span>
          <span className={styles.scrollHint}>Ingeniería Económica · Evaluación de inversiones</span>
        </footer>
      </div>
    </div>
  );
};
