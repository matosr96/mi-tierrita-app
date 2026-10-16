import * as THREE from "three";

/**
 * Héroe fotográfico de la página pública (three.js con fotos reales en capas a distinta profundidad):
 *  · al fondo, un mar de nubes al atardecer teñido con la paleta de la marca;
 *  · al medio, unas manos con un puñado de tierra (recorte sin fondo) que emergen de las nubes;
 *  · delante, bancos de nubes que se desplazan, y tierra que se escurre entre los dedos.
 * La cámara sigue al cursor (paralaje real entre capas) y el scroll la acerca a las manos; al final las nubes
 * de delante suben y cubren la vista.
 */

const SKY_URL = "/media/nubes.webp";
const HANDS_URL = "/media/manos-recorte.webp";
const HANDS_ASPECT = 1720 / 1400;
const SKY_ASPECT = 2000 / 1333;

const cssColor = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

/** Gradación de color a la paleta (mapa de degradado por luminancia), compartida por el cielo y las nubes. */
const GRADE = `
uniform vec3 uShadow; uniform vec3 uMid; uniform vec3 uLight;
vec3 grade(vec3 c, float amount) {
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  vec3 g = l < 0.5 ? mix(uShadow, uMid, l * 2.0) : mix(uMid, uLight, (l - 0.5) * 2.0);
  return mix(c, g, amount);
}
`;

export const createPhotoScene = (canvas: HTMLCanvasElement, onReady?: () => void) => {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const bg = cssColor("--app-bg", "#07110c");
  const leaf = cssColor("--leaf", "#2d6a4f");
  const sprout = cssColor("--sprout", "#b9ec6f");
  const paper = cssColor("--paper", "#f2f1eb");
  const warn = cssColor("--dark-warn", "#e6b35a");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(bg, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const loader = new THREE.TextureLoader();
  const gradeUniforms = {
    uShadow: { value: bg.clone() },
    uMid: { value: leaf.clone().lerp(warn, 0.18) },
    uLight: { value: paper.clone().lerp(sprout, 0.35) },
  };

  // Cielo (plano lejano, más grande que la vista para el paralaje).
  const skyTex = loader.load(SKY_URL);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: skyTex }, ...gradeUniforms },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      uniform sampler2D map; varying vec2 vUv; ${GRADE}
      void main(){
        vec3 c = texture2D(map, vUv).rgb;
        c = grade(c, 0.7);
        float v = distance(vUv, vec2(0.5, 0.45));
        c *= mix(1.0, 0.45, smoothstep(0.25, 0.8, v));
        gl_FragColor = vec4(c, 1.0);
      }`,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), skyMat);
  sky.position.z = -22;
  scene.add(sky);

  // Bancos de nubes: la franja inferior de la misma foto, con bordes desvanecidos.
  const cloudMat = (alpha: number) =>
    new THREE.ShaderMaterial({
      uniforms: { map: { value: skyTex }, uAlpha: { value: alpha }, uLift: { value: 0 }, ...gradeUniforms },
      transparent: true,
      depthWrite: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `
        uniform sampler2D map; uniform float uAlpha; uniform float uLift; varying vec2 vUv; ${GRADE}
        void main(){
          vec2 uv = vec2(vUv.x, vUv.y * 0.36);
          vec3 src = texture2D(map, uv).rgb;
          float l = dot(src, vec3(0.299, 0.587, 0.114));
          // Las nubes de la foto son oscuras: se remapean a los tonos claros de la paleta para que se lean.
          vec3 c = mix(uMid * 0.9, uLight, smoothstep(0.12, 0.62, l));
          c = mix(c, c * 1.25 + 0.05, uLift);
          float a = smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
          gl_FragColor = vec4(c, a * uAlpha);
        }`,
    });
  const cloudLayers = [
    { z: -6, scale: 1.25, alpha: 0.95, drift: 0.25, y: -0.16 },
    { z: 2.5, scale: 1.1, alpha: 1, drift: 0.45, y: -0.3 },
    { z: 6.5, scale: 1.2, alpha: 0.85, drift: 0.7, y: -0.42 },
  ].map((cfg) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cloudMat(cfg.alpha));
    mesh.position.z = cfg.z;
    mesh.renderOrder = cfg.z > 0 ? 3 : 1;
    scene.add(mesh);
    return { ...cfg, mesh };
  });

  // Las manos con la tierra.
  const handsTex = loader.load(HANDS_URL, () => onReady?.());
  handsTex.colorSpace = THREE.SRGBColorSpace;
  handsTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const handsMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: handsTex }, uRim: { value: sprout }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      uniform sampler2D map; uniform vec3 uRim; varying vec2 vUv;
      void main(){
        vec4 t = texture2D(map, vUv);
        vec3 c = t.rgb;
        // Contraste suave y un leve tono cálido; luz de borde lima arriba, como el horizonte.
        c = pow(c, vec3(1.05)) * 1.06;
        c += uRim * 0.12 * smoothstep(0.55, 1.0, vUv.y) * t.a;
        gl_FragColor = vec4(c, t.a);
      }`,
  });
  const hands = new THREE.Mesh(new THREE.PlaneGeometry(HANDS_ASPECT, 1), handsMat);
  hands.renderOrder = 2;
  scene.add(hands);

  // Tierra que se escurre entre los dedos.
  const grains = 320;
  const grainPos = new Float32Array(grains * 3);
  const grainVel = new Float32Array(grains * 3);
  const grainLife = new Float32Array(grains);
  const grainGeo = new THREE.BufferGeometry();
  grainGeo.setAttribute("position", new THREE.BufferAttribute(grainPos, 3));
  const grainMat = new THREE.PointsMaterial({ color: warn.clone().lerp(bg, 0.45), size: 0.035, transparent: true, opacity: 0.9, depthWrite: false });
  const grainPts = new THREE.Points(grainGeo, grainMat);
  grainPts.renderOrder = 2;
  scene.add(grainPts);
  const spawn = (i: number, origin: THREE.Vector3, size: number) => {
    grainPos[i * 3] = origin.x + (Math.random() - 0.5) * size * 0.18;
    grainPos[i * 3 + 1] = origin.y + (Math.random() - 0.5) * size * 0.05;
    grainPos[i * 3 + 2] = origin.z + 0.02;
    grainVel[i * 3] = (Math.random() - 0.5) * 0.05;
    grainVel[i * 3 + 1] = -Math.random() * 0.2;
    grainVel[i * 3 + 2] = 0;
    grainLife[i] = Math.random();
  };

  // Medidas dependientes del tamaño de la vista.
  let viewH = 1;
  let viewW = 1;
  let handsH = 1;
  const layout = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const at = (z: number) => {
      const d = 12 - z;
      const hh = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return { h: hh, w: hh * camera.aspect };
    };
    const s = at(sky.position.z);
    const coverH = Math.max(s.h, s.w / SKY_ASPECT) * 1.35;
    sky.scale.set(coverH * SKY_ASPECT, coverH, 1);
    sky.position.y = coverH * 0.08;
    for (const c of cloudLayers) {
      const v = at(c.mesh.position.z);
      const cw = Math.max(v.w, v.h * 1.4) * c.scale * 1.3;
      c.mesh.scale.set(cw, cw * 0.36 * (1333 / 2000) * 1.8, 1);
    }
    const v0 = at(0);
    viewH = v0.h;
    viewW = v0.w;
    const narrow = camera.aspect < 0.9;
    handsH = narrow ? Math.min(v0.h * 0.42, (v0.w * 1.15) / HANDS_ASPECT) : v0.h * 0.56;
    hands.scale.set(handsH, handsH, 1);
  };
  layout();
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onPointer = (e: PointerEvent) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let scroll = 0;
  let frame = 0;
  let visible = true;
  const start = performance.now();
  let last = start;
  const spout = new THREE.Vector3();
  let seeded = false;

  const render = (now: number) => {
    const t = reduced ? 10 : (now - start) / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 2.4, 1);
    mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 2.4, 1);

    const narrow = camera.aspect < 0.9;
    const rise = reduced ? 1 : smooth(0.3, 3.2, t);
    const near = smooth(0, 0.68, scroll);
    const fogUp = smooth(0.62, 1, scroll);

    // Manos: a la derecha (el brazo sale del borde) en pantallas anchas; centradas abajo en las angostas.
    const baseX = narrow ? viewW * 0.18 : viewW / 2 - (handsH * HANDS_ASPECT) / 2 + handsH * 0.12;
    const baseY = narrow ? -viewH * 0.12 : -viewH * 0.1;
    hands.position.set(
      baseX * (1 - near * 0.85) + Math.sin(t * 0.5) * 0.04,
      baseY + (1 - rise) * -viewH * 0.55 + Math.sin(t * 0.8) * 0.06 + near * viewH * 0.06,
      0,
    );
    hands.rotation.z = Math.sin(t * 0.4) * 0.012 - (1 - rise) * 0.08;
    const zoom = 1 + near * 0.35;
    hands.scale.set(handsH * zoom, handsH * zoom, 1);

    // Las capas de nubes derivan despacio y, al final del scroll, suben y se aclaran.
    for (const c of cloudLayers) {
      const v = 2 * (12 - c.mesh.position.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      c.mesh.position.x = Math.sin(t * 0.05 * c.drift + c.z) * v * 0.06;
      c.mesh.position.y = v * c.y + fogUp * v * (0.45 + c.drift * 0.4) + (1 - rise) * v * 0.08;
      const m = c.mesh.material as THREE.ShaderMaterial;
      m.uniforms.uLift!.value = fogUp * 0.6;
    }

    // Granos de tierra: nacen en el borde del puñado (lado de los dedos) y caen.
    spout.set(hands.position.x - hands.scale.x * 0.38, hands.position.y + hands.scale.y * 0.02, 0.05);
    if (!seeded) {
      for (let i = 0; i < grains; i += 1) spawn(i, spout, hands.scale.x);
      seeded = true;
    }
    for (let i = 0; i < grains; i += 1) {
      grainLife[i] = grainLife[i]! + dt * 0.45;
      grainVel[i * 3 + 1] = grainVel[i * 3 + 1]! - dt * 1.6;
      grainPos[i * 3] = grainPos[i * 3]! + grainVel[i * 3]! * dt;
      grainPos[i * 3 + 1] = grainPos[i * 3 + 1]! + grainVel[i * 3 + 1]! * dt;
      if (grainLife[i]! > 1 || grainPos[i * 3 + 1]! < -viewH) spawn(i, spout, hands.scale.x);
    }
    grainGeo.attributes.position!.needsUpdate = true;
    grainMat.opacity = 0.85 * rise;

    // Cámara: paralaje con el cursor y acercamiento con el scroll.
    camera.position.set(mouse.x * 0.55, -mouse.y * 0.3 + near * 0.25, 12 - near * 6.5);
    camera.lookAt(mouse.x * 0.15 + hands.position.x * near * 0.6, hands.position.y * near * 0.6, -4);

    renderer.render(scene, camera);
    canvas.dataset.ready = "1";
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
  // Con "reducir movimiento" se dibuja de nuevo cuando terminan de cargar las fotos.
  THREE.DefaultLoadingManager.onLoad = () => render(performance.now());
  render(performance.now());
  schedule();

  return {
    setScroll: (p: number) => {
      scroll = Math.min(Math.max(p, 0), 1);
      if (reduced) render(performance.now());
    },
    destroy: () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      THREE.DefaultLoadingManager.onLoad = () => undefined;
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      });
      skyTex.dispose();
      handsTex.dispose();
      renderer.dispose();
    },
  };
};
