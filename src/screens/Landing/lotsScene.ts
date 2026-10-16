import * as THREE from "three";

/**
 * Escena de "El sistema por dentro" (three.js): las mismas 48 cajas cambian de formación con el scroll.
 *  0 · Inventario — estante de lotes ordenados por vencimiento (FEFO), el primero en salir brilla.
 *  1 · Ventas y cartera — las cajas circulan por un circuito hacia la caja (contado en lima, crédito en ámbar).
 *  2 · Decisión — se apilan en cuatro barras que crecen; la más alta, en lima.
 */

const N = 48;
const BOX = 0.78;

type Formation = { pos: THREE.Vector3[]; color: THREE.Color[]; glow: number[]; scale: number };

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Progreso del scroll (0..1) → capítulo continuo (0..2) con mesetas para leer cada uno. */
const chapterOf = (p: number) => {
  if (p < 0.24) return 0;
  if (p < 0.4) return easeInOut((p - 0.24) / 0.16);
  if (p < 0.6) return 1;
  if (p < 0.76) return 1 + easeInOut((p - 0.6) / 0.16);
  return 2;
};

export const createLotsScene = (canvas: HTMLCanvasElement) => {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const bg = cssColor("--app-bg", "#07110c");
  const leaf = cssColor("--leaf", "#2d6a4f");
  const sprout = cssColor("--sprout", "#b9ec6f");
  const bad = cssColor("--dark-bad", "#f09a9c");
  const warn = cssColor("--dark-warn", "#e6b35a");
  const muted = cssColor("--dark-muted", "#62756a");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(bg, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bg, 16, 34);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);

  scene.add(new THREE.HemisphereLight(sprout.clone().lerp(leaf, 0.6), bg, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(6, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(sprout, 1.4);
  rim.position.set(-8, 4, -8);
  scene.add(rim);

  const grid = new THREE.GridHelper(40, 40, sprout, leaf);
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.12;
  scene.add(grid);

  const geo = new THREE.BoxGeometry(BOX, BOX, BOX);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, vertexColors: false });
  const boxes = new THREE.InstancedMesh(geo, mat, N);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  boxes.frustumCulled = false;
  scene.add(boxes);
  // Halo de las cajas destacadas (siguiente en salir, barra más alta).
  const glowMat = new THREE.MeshBasicMaterial({ color: sprout, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const glows = new THREE.InstancedMesh(new THREE.BoxGeometry(BOX * 1.18, BOX * 1.18, BOX * 1.18), glowMat, N);
  glows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  glows.frustumCulled = false;
  scene.add(glows);

  // 0 · Estante: 8 columnas × 3 niveles × 2 de fondo; a la izquierda lo que vence primero.
  const shelf: Formation = { pos: [], color: [], glow: [], scale: 1 };
  for (let i = 0; i < N; i += 1) {
    const col = Math.floor(i / 6);
    const level = Math.floor((i % 6) / 2);
    const depth = i % 2;
    shelf.pos.push(new THREE.Vector3((col - 3.5) * 1.02, 0.42 + level * 1.08, depth * -0.95 + 0.4));
    shelf.color.push(col === 0 ? bad : col <= 2 ? warn : col <= 4 ? sprout : leaf);
    shelf.glow.push(i === 4 ? 1 : 0);
  }

  // 1 · Circuito de ventas: posiciones que se recalculan con el tiempo (ver flowAt).
  const flowColor = Array.from({ length: N }, (_, i) => (i % 3 === 0 ? warn : sprout));
  const flowAt = (i: number, t: number, out: THREE.Vector3) => {
    const u = (i / N + t * 0.035) % 1;
    const a = u * Math.PI * 2;
    out.set(Math.sin(a) * 4.4, 0.42 + Math.max(0, Math.sin(a * 2)) * 0.5, Math.sin(a * 2) * 1.9);
    return out;
  };

  // 2 · Barras de la decisión: 4 barras de 2 cajas de ancho, alturas 3, 5, 7 y 9 niveles.
  const bars: Formation = { pos: [], color: [], glow: [], scale: 1 };
  const heights = [3, 5, 7, 9];
  let k = 0;
  heights.forEach((h, b) => {
    for (let level = 0; level < h; level += 1) {
      for (let w = 0; w < 2; w += 1) {
        if (k >= N) return;
        bars.pos.push(new THREE.Vector3((b - 1.5) * 2.3 + (w - 0.5) * 0.84, 0.42 + level * 0.84, 0));
        bars.color.push(b === 3 ? sprout : b === 0 ? muted : leaf.clone().lerp(sprout, b * 0.2));
        bars.glow.push(b === 3 && level === h - 1 ? 1 : 0);
        k += 1;
      }
    }
  });

  const dummy = new THREE.Object3D();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const color = new THREE.Color();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = 0;
  let frame = 0;
  let visible = true;
  const start = performance.now();
  let last = start;
  let shown = 0;

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const onPointer = (e: PointerEvent) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const formationPos = (f: number, i: number, t: number, out: THREE.Vector3) => {
    if (f === 0) return out.copy(shelf.pos[i]!);
    if (f === 1) return flowAt(i, t, out);
    return out.copy(bars.pos[i]!);
  };
  const formationColor = (f: number, i: number) => (f === 0 ? shelf.color[i]! : f === 1 ? flowColor[i]! : bars.color[i]!);
  const formationGlow = (f: number, i: number) => (f === 0 ? shelf.glow[i]! : f === 1 ? 0 : bars.glow[i]!);

  const render = (now: number) => {
    const t = (now - start) / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 2, 1);
    mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 2, 1);
    // Entrada: las cajas caen desde arriba la primera vez que la escena se ve.
    shown = reduced ? 1 : Math.min(shown + dt / 1.6, 1);

    const c = chapterOf(progress);
    const from = Math.min(Math.floor(c), 1);
    const local = c - from;

    for (let i = 0; i < N; i += 1) {
      // Cada caja arranca un poco después que la anterior: la transición recorre el conjunto como una ola.
      const tt = easeInOut(clamp01(local * 1.7 - (i / N) * 0.7));
      formationPos(from, i, t, tmpA);
      formationPos(from + 1, i, t, tmpB);
      dummy.position.lerpVectors(tmpA, tmpB, tt);
      dummy.position.y += Math.sin(tt * Math.PI) * 1.4;
      const drop = clamp01(shown * 1.8 - (i / N) * 0.8);
      dummy.position.y += (1 - easeInOut(drop)) * 9;
      dummy.rotation.set(0, tt * Math.PI * 0.5 + (from === 1 && tt < 0.5 ? t * 0.4 : 0) * (1 - tt), Math.sin(tt * Math.PI) * 0.4);
      dummy.scale.setScalar(drop > 0 ? 1 : 0.001);
      dummy.updateMatrix();
      boxes.setMatrixAt(i, dummy.matrix);
      color.copy(formationColor(from, i)).lerp(formationColor(from + 1, i), tt);
      boxes.setColorAt(i, color);
      const g = formationGlow(from, i) * (1 - tt) + formationGlow(from + 1, i) * tt;
      dummy.scale.setScalar(g > 0.01 ? (1 + Math.sin(t * 3) * 0.04) * (drop > 0 ? 1 : 0.001) : 0.0001);
      dummy.updateMatrix();
      glows.setMatrixAt(i, dummy.matrix);
    }
    boxes.instanceMatrix.needsUpdate = true;
    if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true;
    glows.instanceMatrix.needsUpdate = true;

    const angle = 0.55 + Math.sin(t * 0.12) * 0.12 + mouse.x * 0.25 + c * 0.18;
    // En la última formación las barras son altas: la cámara se aleja y sube la mirada.
    const tall = Math.max(c - 1, 0);
    const radius = 15 - Math.min(c, 1) * 0.6 + tall * 4.5;
    camera.position.set(Math.sin(angle) * radius, 6.2 + c * 0.9 + tall * 1.2 - mouse.y * 0.8, Math.cos(angle) * radius);
    camera.lookAt(0, 1.6 + c * 1.1 + tall * 1.8, 0);

    renderer.render(scene, camera);
  };

  const loop = (now: number) => {
    frame = 0;
    render(now);
    schedule();
  };
  function schedule() {
    if (reduced || frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(loop);
  }
  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) {
      last = performance.now();
      schedule();
    }
  });
  io.observe(canvas);
  const onVisibility = () => {
    last = performance.now();
    schedule();
  };
  document.addEventListener("visibilitychange", onVisibility);
  render(performance.now());
  schedule();

  return {
    setProgress: (p: number) => {
      progress = clamp01(p);
      if (!frame) render(performance.now());
    },
    destroy: () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      geo.dispose();
      mat.dispose();
      glowMat.dispose();
      glows.geometry.dispose();
      grid.geometry.dispose();
      gridMat.dispose();
      renderer.dispose();
    },
  };
};
