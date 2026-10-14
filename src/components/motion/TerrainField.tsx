import { useEffect, useRef } from "react";
import styles from "./ShaderField.module.css";

export type TerrainPhase = "idle" | "leaving";

const COLS = 150;
const ROWS = 110;
const WIDTH = 18;
const DEPTH = 30;
/** El terreno empieza un poco detrás de la cámara para cubrir el borde inferior de la pantalla. */
const NEAR = 3.5;

const VERTEX = `
attribute vec2 a_uv;
uniform mat4 u_mvp;
uniform float u_travel;
uniform float u_amp;
uniform float u_scan;
varying float v_h;
varying float v_depth;
varying float v_scan;
varying float v_x;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.07; a *= 0.5; }
  return v;
}
void main() {
  float x = (a_uv.x - 0.5) * ${WIDTH.toFixed(1)};
  float z = ${NEAR.toFixed(1)} - a_uv.y * ${DEPTH.toFixed(1)};
  float h = fbm(vec2(x * 0.16, (z - u_travel) * 0.16));
  // Un valle por el centro: el camino por donde avanza la cámara.
  float valley = smoothstep(0.4, 4.5, abs(x));
  float y = (h * 2.8 - 1.0) * u_amp * mix(0.25, 1.0, valley);
  v_h = h;
  v_depth = a_uv.y;
  v_x = a_uv.x;
  v_scan = exp(-pow((-z - u_scan) * 0.9, 2.0));
  gl_Position = u_mvp * vec4(x, y, z, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;
uniform vec3 u_mid;
uniform vec3 u_hot;
uniform vec3 u_alert;
uniform float u_alertMix;
varying float v_h;
varying float v_depth;
varying float v_scan;
varying float v_x;
void main() {
  float fog = smoothstep(1.0, 0.12, v_depth) * smoothstep(0.0, 0.05, v_depth);
  float edge = smoothstep(0.0, 0.14, v_x) * smoothstep(1.0, 0.86, v_x);
  float contour = smoothstep(0.86, 1.0, fract(v_h * 9.0));
  vec3 col = mix(u_mid, u_hot, smoothstep(0.5, 0.85, v_h));
  col = mix(col, u_hot, contour * 0.55);
  vec3 scanCol = mix(u_hot, u_alert, u_alertMix);
  col = mix(col, scanCol, v_scan);
  float a = fog * edge * (0.34 + 0.6 * smoothstep(0.3, 0.85, v_h) + contour * 0.25) + v_scan * 0.75 * fog * edge;
  gl_FragColor = vec4(col * a, a);
}
`;

type Mat4 = Float32Array;

const perspective = (fovy: number, aspect: number, near: number, far: number): Mat4 => {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
};

const lookAt = (eye: number[], target: number[], up: number[]): Mat4 => {
  const [ex, ey, ez] = eye as [number, number, number];
  let zx = ex - target[0]!;
  let zy = ey - target[1]!;
  let zz = ez - target[2]!;
  let len = Math.hypot(zx, zy, zz);
  zx /= len;
  zy /= len;
  zz /= len;
  let xx = up[1]! * zz - up[2]! * zy;
  let xy = up[2]! * zx - up[0]! * zz;
  let xz = up[0]! * zy - up[1]! * zx;
  len = Math.hypot(xx, xy, xz);
  xx /= len;
  xy /= len;
  xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1,
  ]);
};

const multiply = (a: Mat4, b: Mat4): Mat4 => {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) {
    for (let r = 0; r < 4; r += 1) {
      let s = 0;
      for (let k = 0; k < 4; k += 1) s += a[k * 4 + r]! * b[c * 4 + k]!;
      out[c * 4 + r] = s;
    }
  }
  return out;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
};

/** Malla de líneas: filas completas (horizontales) y una de cada tres columnas (profundidad). */
const buildMesh = () => {
  const uv = new Float32Array(COLS * ROWS * 2);
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const i = (r * COLS + c) * 2;
      uv[i] = c / (COLS - 1);
      uv[i + 1] = r / (ROWS - 1);
    }
  }
  const idx: number[] = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS - 1; c += 1) idx.push(r * COLS + c, r * COLS + c + 1);
  }
  for (let c = 0; c < COLS; c += 3) {
    for (let r = 0; r < ROWS - 1; r += 1) idx.push(r * COLS + c, (r + 1) * COLS + c);
  }
  return { uv, indices: new Uint16Array(idx) };
};

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

type Props = {
  className?: string;
  /** "leaving": la cámara acelera y baja hacia el horizonte. */
  phase?: TerrainPhase;
  /** Cada vez que cambia (y es mayor que 0), la línea de escaneo se tiñe de rojo un momento. */
  alert?: number;
};

/**
 * Terreno en malla de alambre (WebGL, sin librerías): se levanta al cargar, avanza en vuelo lento, lo barre una
 * línea de escaneo y la cámara sigue al cursor. Lee los colores del tema, se pausa fuera de la vista y con
 * "reducir movimiento" dibuja un único cuadro ya levantado. Sin WebGL queda el fondo CSS del contenedor.
 */
export const TerrainField = ({ className, phase = "idle", alert = 0 }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<TerrainPhase>(phase);
  const phaseAt = useRef(0);
  const alertAt = useRef(-1e9);

  useEffect(() => {
    phaseRef.current = phase;
    phaseAt.current = performance.now();
  }, [phase]);
  useEffect(() => {
    if (alert > 0) alertAt.current = performance.now();
  }, [alert]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const mesh = buildMesh();
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uv, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(program, "a_uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uMvp = u("u_mvp");
    const uTravel = u("u_travel");
    const uAmp = u("u_amp");
    const uScan = u("u_scan");
    const uAlertMix = u("u_alertMix");
    const css = getComputedStyle(document.documentElement);
    const base = hexToRgb(css.getPropertyValue("--app-bg") || "#07110c");
    gl.uniform3fv(u("u_mid"), hexToRgb(css.getPropertyValue("--leaf") || "#2d6a4f"));
    gl.uniform3fv(u("u_hot"), hexToRgb(css.getPropertyValue("--sprout") || "#b9ec6f"));
    gl.uniform3fv(u("u_alert"), hexToRgb(css.getPropertyValue("--dark-bad") || "#f09a9c"));
    gl.clearColor(base[0], base[1], base[2], 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    let aspect = 1;
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      aspect = w / h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onPointer = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) schedule();
    });
    io.observe(canvas);

    let frame = 0;
    let last = performance.now();
    const start = last;
    let travel = 0;
    let speed = 0.55;
    let lift = 0;

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;
      const current = phaseRef.current;
      const since = (now - phaseAt.current) / 1000;

      // Velocidad y elevación de la cámara según la fase.
      const targetSpeed = current === "leaving" ? 9 : 0.55;
      speed += (targetSpeed - speed) * Math.min(dt * (current === "leaving" ? 2.2 : 1.5), 1);
      travel += speed * dt;
      lift += ((current === "leaving" ? -1.1 : 0) - lift) * Math.min(dt * 2, 1);
      mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 2.5, 1);
      mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 2.5, 1);

      const amp = reduced ? 1 : easeInOut(Math.min(t / 2.8, 1));
      const alertMix = Math.max(0, 1 - (now - alertAt.current) / 1600);
      const scan = reduced ? 9 : ((t * 7) % 34) - 3;

      const fov = current === "leaving" ? 0.9 - Math.min(since, 1) * 0.25 : 0.9;
      const eye = [mouse.x * 1.4, 2.3 + lift - mouse.y * 0.45, 3.2];
      const target = [mouse.x * 0.6, 0.3 + lift * 0.6, -10];
      const mvp = multiply(perspective(fov, aspect, 0.1, 60), lookAt(eye, target, [0, 1, 0]));

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(uMvp, false, mvp);
      gl.uniform1f(uTravel, travel);
      gl.uniform1f(uAmp, amp);
      gl.uniform1f(uScan, scan);
      gl.uniform1f(uAlertMix, alertMix);
      gl.drawElements(gl.LINES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
      canvas.dataset.ready = "1";
      if (!reduced) schedule();
    };
    function schedule() {
      if (frame || !visible || document.hidden) return;
      frame = requestAnimationFrame(draw);
    }
    const onVisibility = () => {
      last = performance.now();
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibility);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={ref} className={[styles.canvas, className ?? ""].join(" ")} aria-hidden="true" />;
};
