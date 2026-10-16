import * as THREE from "three";

/**
 * "El sistema por dentro" como guion (three.js): nueve momentos ligados al scroll que cuentan qué hace el sistema.
 *  Inventario — llega una compra · el estante se ordena por vencimiento · sale primero el que vence antes.
 *  Ventas y cartera — venta en el mostrador con factura · el saldo sube dentro del cupo · un abono lo baja.
 *  Decisión — escenarios como barras · el piso es VPN = 0 y el que no conviene se hunde · el mejor se enciende.
 * Las etiquetas se pintan en HTML: la escena informa en qué punto de la pantalla va cada una.
 */

export type StoryLabel = { id: string; x: number; y: number; visible: boolean };

const N = 30;
const BOX = 0.78;
/** Momentos del guion en el avance del scroll (tres por capítulo). */
const KEYS = [0.03, 0.13, 0.23, 0.31, 0.41, 0.51, 0.6, 0.72, 0.82, 0.92];

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const win = (p: number, a: number, b: number, fade = 0.025) => clamp01((p - a) / fade) * clamp01((b - p) / fade);

type Pose = { pos: THREE.Vector3; color: THREE.Color; scale: number; glow: number };

export const createStoryScene = (canvas: HTMLCanvasElement, onLabels?: (labels: StoryLabel[]) => void) => {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const bg = cssColor("--app-bg", "#07110c");
  const leaf = cssColor("--leaf", "#2d6a4f");
  const sprout = cssColor("--sprout", "#b9ec6f");
  const bad = cssColor("--dark-bad", "#f09a9c");
  const warn = cssColor("--dark-warn", "#e6b35a");
  const paper = cssColor("--paper", "#f2f1eb");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(bg, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bg, 18, 36);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight(sprout.clone().lerp(leaf, 0.6), bg, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(6, 10, 8);
  scene.add(key);
  const rim = new THREE.DirectionalLight(sprout, 1.3);
  rim.position.set(-8, 4, -8);
  scene.add(rim);

  const grid = new THREE.GridHelper(40, 40, sprout, leaf);
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = 0.12;
  scene.add(grid);

  // Piso VPN = 0: un plano lima translúcido que aparece en el capítulo de la decisión.
  const zeroMat = new THREE.MeshBasicMaterial({ color: sprout, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const zero = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.2), zeroMat);
  zero.rotation.x = -Math.PI / 2;
  zero.position.y = 0.01;
  scene.add(zero);

  // Cajas (lotes).
  const boxes = new THREE.InstancedMesh(new THREE.BoxGeometry(BOX, BOX, BOX), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }), N);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  boxes.frustumCulled = false;
  scene.add(boxes);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const glows = new THREE.InstancedMesh(new THREE.BoxGeometry(BOX * 1.2, BOX * 1.2, BOX * 1.2), glowMat, N);
  glows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  glows.frustumCulled = false;
  scene.add(glows);

  // Mostrador, factura, columna del cupo y monedas del abono.
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1.1, 1.3), new THREE.MeshStandardMaterial({ color: leaf.clone().lerp(bg, 0.3), roughness: 0.7 }));
  counter.position.set(0.4, 0.55, 1.2);
  scene.add(counter);
  const receipt = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), new THREE.MeshStandardMaterial({ color: paper, emissive: paper, emissiveIntensity: 0.25, side: THREE.DoubleSide }));
  receipt.position.set(1.3, 1.1, 1.2);
  scene.add(receipt);
  const COL_H = 4;
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, COL_H, 32, 1, true),
    new THREE.MeshStandardMaterial({ color: sprout, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
  );
  column.position.set(3.4, COL_H / 2, 0.4);
  scene.add(column);
  const columnRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: sprout }));
  columnRing.rotation.x = Math.PI / 2;
  columnRing.position.set(3.4, COL_H, 0.4);
  scene.add(columnRing);
  const fillMat = new THREE.MeshStandardMaterial({ color: warn, emissive: warn, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1, 32), fillMat);
  fill.position.set(3.4, 0, 0.4);
  scene.add(fill);
  const coins = Array.from({ length: 3 }, () => {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 28), new THREE.MeshStandardMaterial({ color: sprout, emissive: sprout, emissiveIntensity: 0.5, metalness: 0.6, roughness: 0.3 }));
    scene.add(coin);
    return coin;
  });

  // ---- Poses de las cajas en cada momento del guion ----
  // Vencimiento relativo de cada caja (0 = vence primero). Las 6 de la compra nueva vencen más tarde.
  const rank = Array.from({ length: 24 }, (_, i) => i).sort((a, b) => Math.sin(a * 91.7) - Math.sin(b * 91.7));
  const rankOf = (i: number) => (i < 24 ? rank.indexOf(i) : i);
  const colorOfRank = (r: number) => (r < 3 ? bad : r < 11 ? warn : r < 22 ? sprout : leaf);
  const shelfSlot = (s: number) => new THREE.Vector3((Math.floor(s / 6) - 2) * 1.0, 0.42 + Math.floor((s % 6) / 2) * 1.0, (s % 2) * -0.95 + 0.45);
  const firstOut = rank.indexOf(0) >= 0 ? rank[0]! : 0; // la caja que vence primero
  const expired = rank[1]!;

  const poses: Pose[][] = [];
  const pose = (pos: THREE.Vector3, color: THREE.Color, scale = 1, glow = 0): Pose => ({ pos, color, scale, glow });
  const pallet = (i: number, y: number) => new THREE.Vector3(3.2 + ((i - 24) % 3) * 0.82, y + Math.floor((i - 24) / 3) * 0.82, 2.4);
  // K0 · la compra aparece en el aire; el estante está desordenado.
  poses.push(Array.from({ length: N }, (_, i) => (i < 24 ? pose(shelfSlot(i), colorOfRank(rankOf(i))) : pose(pallet(i, 6), leaf))));
  // K1 · la compra baja al piso.
  poses.push(Array.from({ length: N }, (_, i) => (i < 24 ? pose(shelfSlot(i), colorOfRank(rankOf(i))) : pose(pallet(i, 0.42), leaf))));
  // K2 · todo se ordena por vencimiento (izquierda = vence antes).
  const sorted = Array.from({ length: N }, (_, i) => pose(shelfSlot(rankOf(i)), colorOfRank(rankOf(i)), 1, i === expired ? 0.6 : 0));
  poses.push(sorted);
  // K3 · sale primero el que vence antes.
  poses.push(sorted.map((p, i) => (i === firstOut ? pose(new THREE.Vector3(0.2, 0.42, 3), sprout, 1, 1) : p)));
  // K4 · venta: la caja llega al mostrador; el resto queda como bodega al fondo.
  const stock = (i: number) => pose(shelfSlot(rankOf(i)).multiplyScalar(0.55).add(new THREE.Vector3(-3.4, 0, -1.2)), colorOfRank(rankOf(i)), 0.55);
  poses.push(Array.from({ length: N }, (_, i) => (i === firstOut ? pose(new THREE.Vector3(-0.2, 1.5, 1.2), sprout, 1, 0.8) : stock(i))));
  // K5 · a crédito: la venta entra a la columna del cupo del cliente.
  poses.push(Array.from({ length: N }, (_, i) => (i === firstOut ? pose(new THREE.Vector3(3.4, 4.4, 0.4), warn, 0.05) : stock(i))));
  // K6 · abono (la caja ya está dentro).
  poses.push(poses[5]!);
  // K7 · escenarios: tres barras de 2 cajas de ancho (A 12, B 10, C 8).
  const heights = [6, 5, 4];
  const barPose = (i: number, sink: boolean) => {
    let k = i;
    for (let b = 0; b < 3; b += 1) {
      const n = heights[b]! * 2;
      if (k < n) {
        const level = Math.floor(k / 2);
        const x = (b - 1) * 2.3 + ((k % 2) - 0.5) * 0.84;
        const y = 0.42 + level * 0.84;
        const below = sink && b === 2;
        return pose(new THREE.Vector3(x, below ? -y : y, 0), below ? bad : b === 0 ? leaf.clone().lerp(sprout, 0.5) : leaf.clone().lerp(sprout, 0.25 - b * 0.1));
      }
      k -= n;
    }
    return pose(new THREE.Vector3(0, -5, 0), leaf, 0);
  };
  poses.push(Array.from({ length: N }, (_, i) => barPose(i, false)));
  // K8 · el piso es VPN = 0: el escenario que destruye valor se hunde.
  poses.push(Array.from({ length: N }, (_, i) => barPose(i, true)));
  // K9 · el que conviene se enciende.
  poses.push(poses[8]!.map((p, i) => (i < 12 ? pose(p.pos, sprout, 1, i >= 10 ? 1 : 0.25) : p)));

  // Cámara por capítulo.
  const CAMS = [
    { angle: 0.5, radius: 15, y: 6, look: new THREE.Vector3(-0.3, 1.8, 0.5) },
    { angle: 0.25, radius: 17, y: 6, look: new THREE.Vector3(0.3, 2.3, 0.5) },
    { angle: 0.45, radius: 22, y: 4.2, look: new THREE.Vector3(-0.4, 1.2, 0) },
  ];

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const tmp = new THREE.Vector3();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let progress = 0;
  let target = 0;
  const cam = { angle: CAMS[0]!.angle, radius: CAMS[0]!.radius, y: CAMS[0]!.y, look: CAMS[0]!.look.clone() };
  let frame = 0;
  let visible = true;
  const start = performance.now();
  let last = start;

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

  // Anclas de las etiquetas (se recalculan cada cuadro) y su ventana de aparición en el guion.
  const LABELS: { id: string; from: number; to: number; at: () => THREE.Vector3 }[] = [
    { id: "compra", from: 0.02, to: 0.17, at: () => tmp.set(4, 2.4 + (1 - clamp01((progress - 0.03) / 0.1)) * 5, 2.4) },
    { id: "antes", from: 0.18, to: 0.34, at: () => tmp.set(-2, 3.6, 0.4) },
    { id: "despues", from: 0.18, to: 0.34, at: () => tmp.set(2, 3.6, 0.4) },
    { id: "sale", from: 0.27, to: 0.36, at: () => tmp.set(0.2, 1.4, 3) },
    { id: "factura", from: 0.38, to: 0.49, at: () => tmp.set(1.3, 2.1, 1.2) },
    { id: "saldo", from: 0.48, to: 0.57, at: () => tmp.set(3.4, 4.5, 0.4) },
    { id: "abono", from: 0.57, to: 0.67, at: () => tmp.set(3.4, 4.6, 0.4) },
    { id: "cero", from: 0.79, to: 1.01, at: () => tmp.set(4.4, 0.05, 1.6) },
    { id: "negativo", from: 0.8, to: 1.01, at: () => tmp.set(2.3, -3.4, 0) },
    { id: "conviene", from: 0.88, to: 1.01, at: () => tmp.set(-2.3, 5.6, 0) },
  ];

  const render = (now: number) => {
    const t = (now - start) / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    progress += (target - progress) * (reduced ? 1 : Math.min(dt * 3, 1));
    const p = progress;
    mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 2, 1);
    mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 2, 1);

    // Tramo del guion entre dos momentos.
    let k = 0;
    while (k < KEYS.length - 2 && p > KEYS[k + 1]!) k += 1;
    const local = clamp01((p - KEYS[k]!) / (KEYS[k + 1]! - KEYS[k]!));
    const A = poses[k]!;
    const B = poses[k + 1]!;

    for (let i = 0; i < N; i += 1) {
      const tt = ease(clamp01(local * 1.35 - (i / N) * 0.35));
      const a = A[i]!;
      const b = B[i]!;
      dummy.position.lerpVectors(a.pos, b.pos, tt);
      dummy.position.y += Math.sin(tt * Math.PI) * (a.pos.distanceTo(b.pos) > 2 ? 0.8 : 0.15);
      dummy.rotation.set(0, Math.sin(tt * Math.PI) * 0.3, 0);
      const s = a.scale + (b.scale - a.scale) * tt;
      dummy.scale.setScalar(Math.max(s, 0.0001));
      dummy.updateMatrix();
      boxes.setMatrixAt(i, dummy.matrix);
      boxes.setColorAt(i, color.copy(a.color).lerp(b.color, tt));
      const g = a.glow + (b.glow - a.glow) * tt;
      // El lote vencido parpadea; los destacados laten.
      const pulse = i === expired && p > 0.18 && p < 0.38 ? 0.5 + Math.sin(t * 6) * 0.5 : 1 + Math.sin(t * 3) * 0.04;
      dummy.scale.setScalar(g > 0.02 ? Math.max(s, 0.0001) * (i === expired ? 1 : pulse) : 0.0001);
      dummy.updateMatrix();
      glows.setMatrixAt(i, dummy.matrix);
      glows.setColorAt(i, i === expired && p < 0.38 ? bad : sprout);
    }
    boxes.instanceMatrix.needsUpdate = true;
    if (boxes.instanceColor) boxes.instanceColor.needsUpdate = true;
    glows.instanceMatrix.needsUpdate = true;
    if (glows.instanceColor) glows.instanceColor.needsUpdate = true;

    // Utilería de ventas: aparece en su capítulo.
    const sales = win(p, 0.35, 0.68, 0.04);
    counter.scale.set(1, Math.max(sales, 0.0001), 1);
    counter.position.y = 0.55 * sales;
    const print = clamp01((p - 0.4) / 0.06) * clamp01((0.5 - p) / 0.03);
    receipt.scale.set(1, Math.max(print, 0.0001), 1);
    receipt.position.y = 1.1 + print * 0.6;
    const col = win(p, 0.44, 0.68, 0.04);
    column.scale.set(col, Math.max(col, 0.0001), col);
    columnRing.scale.setScalar(Math.max(col, 0.0001));
    // Nivel del saldo: 30 % → sube al 64 % con la venta → baja al 40 % con el abono.
    const level = 0.3 + 0.34 * ease(clamp01((p - 0.48) / 0.05)) - 0.24 * ease(clamp01((p - 0.58) / 0.05));
    const fh = COL_H * level * col;
    fill.scale.set(col, Math.max(fh, 0.0001), col);
    fill.position.y = fh / 2;
    fillMat.color.copy(warn).lerp(sprout, clamp01((p - 0.58) / 0.05));
    coins.forEach((coin, i) => {
      const drop = clamp01((p - 0.55 - i * 0.012) / 0.04);
      coin.visible = p > 0.54 && p < 0.68;
      coin.position.set(3.4 + (i - 1) * 0.15, 6.5 - drop * (6.5 - COL_H * 0.6), 0.4);
      coin.rotation.set(t * 2 + i, 0, 0.4);
      coin.scale.setScalar(Math.max(1 - clamp01((drop - 0.9) / 0.1), 0.0001));
    });
    zeroMat.opacity = 0.16 * win(p, 0.76, 1.1, 0.04);

    // Cámara: mezcla entre los encuadres de cada capítulo, con inercia.
    const c = p < 0.33 ? 0 : p < 0.36 ? (p - 0.33) / 0.03 : p < 0.66 ? 1 : p < 0.7 ? 1 + (p - 0.66) / 0.04 : 2;
    const i0 = Math.min(Math.floor(c), 1);
    const f = ease(c - i0);
    const goal = CAMS[i0]!;
    const goal2 = CAMS[Math.min(i0 + 1, 2)]!;
    const kc = reduced ? 1 : Math.min(dt * 2.2, 1);
    cam.angle += (goal.angle + (goal2.angle - goal.angle) * f + mouse.x * 0.18 + Math.sin(t * 0.1) * 0.05 - cam.angle) * kc;
    cam.radius += (goal.radius + (goal2.radius - goal.radius) * f - cam.radius) * kc;
    cam.y += (goal.y + (goal2.y - goal.y) * f - mouse.y * 0.5 - cam.y) * kc;
    tmp.lerpVectors(goal.look, goal2.look, f);
    cam.look.lerp(tmp, kc);
    camera.position.set(Math.sin(cam.angle) * cam.radius, cam.y, Math.cos(cam.angle) * cam.radius);
    camera.lookAt(cam.look);

    renderer.render(scene, camera);

    if (onLabels) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      onLabels(
        LABELS.map((l) => {
          const v = l.at().clone().project(camera);
          return { id: l.id, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: p >= l.from && p <= l.to && v.z < 1 };
        }),
      );
    }
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
    setProgress: (v: number) => {
      target = clamp01(v);
      if (reduced) render(performance.now());
    },
    destroy: () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
    },
  };
};
