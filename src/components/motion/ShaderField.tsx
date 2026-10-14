import { useEffect, useRef } from "react";
import styles from "./ShaderField.module.css";

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* Ruido fbm con deformación de dominio: una aurora lenta en verdes y lima que se curva hacia el cursor. */
const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_base;
uniform vec3 u_mid;
uniform vec3 u_hot;
uniform float u_intensity;

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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);
  float t = u_time * 0.035;
  float md = exp(-3.0 * distance(p, m));
  vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 - t + 5.2));
  vec2 r = vec2(fbm(p * 1.4 + 3.0 * q + vec2(1.7, 9.2) + t * 1.5 + md * 0.6), fbm(p * 1.4 + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.2 + 2.5 * r);
  vec3 col = mix(u_base, u_mid, smoothstep(0.35, 0.95, f) * u_intensity);
  col = mix(col, u_hot, smoothstep(0.74, 1.08, f + 0.25 * length(r)) * 0.5 * u_intensity);
  col += u_hot * md * 0.05 * u_intensity;
  float vig = smoothstep(1.3, 0.2, length(uv - vec2(0.62, 0.5)));
  col = mix(u_base, col, mix(0.45, 1.0, vig));
  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** "#2d6a4f" → [r, g, b] en 0..1. */
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
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

type Props = { className?: string; /** 0..1, cuánto color se mezcla sobre la base. */ intensity?: number };

/**
 * Fondo vivo en WebGL para superficies oscuras (login, portadas). Lee los colores de las variables del tema,
 * se pausa fuera de la vista o con la pestaña oculta, y dibuja un solo cuadro si se pide reducir el movimiento.
 * Sin WebGL, el lienzo queda transparente y se ve el fondo CSS del contenedor.
 */
export const ShaderField = ({ className, intensity = 1 }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
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

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("u_res");
    const uTime = u("u_time");
    const uMouse = u("u_mouse");
    const css = getComputedStyle(document.documentElement);
    gl.uniform3fv(u("u_base"), hexToRgb(css.getPropertyValue("--app-bg") || "#07110c"));
    gl.uniform3fv(u("u_mid"), hexToRgb(css.getPropertyValue("--leaf") || "#2d6a4f"));
    gl.uniform3fv(u("u_hot"), hexToRgb(css.getPropertyValue("--sprout") || "#b9ec6f"));
    gl.uniform1f(u("u_intensity"), intensity);

    // Se dibuja a media resolución: es un fondo difuso y así cuesta poco.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * scale));
      const h = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5 };
    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
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
    const start = performance.now();
    const draw = (now: number) => {
      frame = 0;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      gl.uniform1f(uTime, (now - start) / 1000 + 20);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      canvas.dataset.ready = "1";
      if (!reduced) schedule();
    };
    function schedule() {
      if (frame || !visible || document.hidden) return;
      frame = requestAnimationFrame(draw);
    }
    const onVisibility = () => schedule();
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
  }, [intensity]);

  return <canvas ref={ref} className={[styles.canvas, className ?? ""].join(" ")} aria-hidden="true" />;
};
