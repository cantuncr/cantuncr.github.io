// "CTSS universe": a dotted core in the brand duotone, orbiting venture nodes and
// travelling connection arcs. Follows the pointer; disperses as the hero scrolls away.
// Scroll progress (0..1) is read from window.__universe.progress (set by site.js).
import * as THREE from '../vendor/three.module.min.js';

const mount = document.querySelector('.hero__universe');
const state = (window.__universe = window.__universe || { progress: 0 });

const VIOLET = new THREE.Color('#7c3aed');
const MAGENTA = new THREE.Color('#c026d3');
const ORANGE = new THREE.Color('#ff8a3d');
const R = 1.5;
const VENTURES = 16;

const pointVertex = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uSize;
  attribute float aRand;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec3 p = position;
    float wobble = sin(uTime * 0.9 + aRand * 6.2831) * 0.018;
    p += normalize(position) * (wobble + uScroll * aRand * 2.6);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.55 + aRand) / -mv.z;
    float facing = dot(normalize(normalMatrix * normalize(position)), vec3(0.0, 0.0, 1.0));
    vAlpha = mix(0.1, 1.0, smoothstep(-0.4, 0.6, facing)) * (0.45 + 0.55 * aRand);
    vAlpha *= 1.0 - uScroll * 0.8;
    vColor = aColor;
  }
`;

const pointFragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vAlpha);
  }
`;

// Violet (bottom) → magenta → orange (top), matching the hero photo's duotone
function brandColor(t) {
  return t < 0.5 ? VIOLET.clone().lerp(MAGENTA, t * 2) : MAGENTA.clone().lerp(ORANGE, (t - 0.5) * 2);
}

function fibonacciSphere(count, radius) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    pos.set([Math.cos(t) * r * radius, y * radius, Math.sin(t) * r * radius], i * 3);
    const c = brandColor((y + 1) / 2);
    col.set([c.r, c.g, c.b], i * 3);
    rand[i] = Math.random();
  }
  return { pos, col, rand };
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return; // No WebGL: the hero still works without the scene
  }
  const small = window.innerWidth < 768;
  const dpr = Math.min(window.devicePixelRatio, small ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 5.4);

  const root = new THREE.Group();
  const core = new THREE.Group();
  root.add(core);
  scene.add(root);

  // Dotted core
  const { pos, col, rand } = fibonacciSphere(small ? 3200 : 5200, R);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  pGeo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  const pMat = new THREE.ShaderMaterial({
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uSize: { value: 11 * dpr } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  core.add(new THREE.Points(pGeo, pMat));

  // Faint wireframe shell
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.003, 3)),
    new THREE.LineBasicMaterial({ color: MAGENTA, transparent: true, opacity: 0.06 }),
  );
  core.add(wire);

  // Travelling connection arcs
  const SEGMENTS = 80;
  const arcs = Array.from({ length: 14 }, (_, i) => {
    const a = new THREE.Vector3().randomDirection().multiplyScalar(R);
    const b = new THREE.Vector3().randomDirection().multiplyScalar(R);
    const mid = a.clone().add(b).normalize().multiplyScalar(R + a.distanceTo(b) * 0.45);
    const geo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(SEGMENTS));
    const mat = new THREE.LineBasicMaterial({ color: i % 2 ? ORANGE : MAGENTA, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    core.add(new THREE.Line(geo, mat));
    return { geo, mat, phase: Math.random(), speed: 0.18 + Math.random() * 0.22 };
  });

  // Orbit rings carrying one node per venture
  const orbits = [
    { radius: R * 1.38, tilt: [1.2, 0.3, 0], color: MAGENTA, opacity: 0.22, speed: 0.22 },
    { radius: R * 1.58, tilt: [1.85, -0.5, 0.4], color: 0xffffff, opacity: 0.08, speed: -0.14 },
    { radius: R * 1.78, tilt: [1.45, 0.9, -0.3], color: ORANGE, opacity: 0.12, speed: 0.1 },
  ];
  const nodeGeo = new THREE.SphereGeometry(0.03, 12, 12);
  const nodes = [];
  const rings = orbits.map((o, oi) => {
    const pts = new THREE.EllipseCurve(0, 0, o.radius, o.radius, 0, Math.PI * 2).getPoints(180).map((p) => new THREE.Vector3(p.x, p.y, 0));
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: o.color, transparent: true, opacity: o.opacity }));
    ring.rotation.set(...o.tilt);
    root.add(ring);
    return { ring, ...o, index: oi };
  });
  for (let i = 0; i < VENTURES; i++) {
    const ring = rings[i % rings.length];
    const c = brandColor(i / (VENTURES - 1));
    const node = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: c }));
    const halo = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(2.6);
    node.add(halo);
    ring.ring.add(node);
    nodes.push({ node, ring, angle: (i / VENTURES) * Math.PI * 2 * 3 + Math.random() });
  }

  // Stardust
  const dustCount = small ? 500 : 900;
  const dust = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(R * (1.9 + Math.random() * 3));
    dust.set([v.x, v.y, v.z], i * 3);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPts = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.012, transparent: true, opacity: 0.45, depthWrite: false }));
  scene.add(dustPts);

  // Core sits right on desktop, behind the copy on small screens
  let baseScale = 1;
  const resize = () => {
    const w = mount.clientWidth;
    const h = mount.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const desktop = w >= 1024;
    root.position.x = desktop ? 1.7 : 0;
    root.position.y = desktop ? 0 : 0.55;
    baseScale = desktop ? 1 : 0.72;
  };
  resize();
  new ResizeObserver(resize).observe(mount);

  const pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(mount);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = performance.now();
  let scrollEased = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = (performance.now() - start) / 1000;
    const speed = reduced ? 0.15 : 1;
    scrollEased += ((state.progress || 0) - scrollEased) * 0.08;

    pMat.uniforms.uTime.value = t;
    pMat.uniforms.uScroll.value = scrollEased;
    wire.material.opacity = 0.06 * (1 - scrollEased);

    core.rotation.y = t * 0.12 * speed + scrollEased * 2.4;
    root.rotation.x += ((pointer.y * 0.28 + 0.18) - root.rotation.x) * 0.04;
    root.rotation.z += ((-pointer.x * 0.14) - root.rotation.z) * 0.04;
    root.scale.setScalar(baseScale * (1 + scrollEased * 0.4));

    rings.forEach((r) => {
      r.ring.rotation.z = t * r.speed * speed;
      r.ring.material.opacity = r.opacity * (1 - scrollEased);
    });
    nodes.forEach((n) => {
      const a = n.angle + t * 0.35 * speed;
      const rr = n.ring.radius * (1 + scrollEased * 0.9);
      n.node.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0);
    });
    dustPts.rotation.y = t * 0.02;
    dustPts.rotation.x = pointer.y * 0.05;

    arcs.forEach((a) => {
      const cycle = (t * a.speed * speed + a.phase) % 1.3;
      const head = Math.floor(Math.min(cycle, 1) * SEGMENTS);
      const tail = Math.max(0, head - 34);
      a.geo.setDrawRange(tail, Math.max(0, head - tail + 1));
      a.mat.opacity = (cycle > 1 ? 1 - (cycle - 1) / 0.3 : 1) * 0.85 * (1 - scrollEased);
    });

    renderer.render(scene, camera);
  };
  loop();
  mount.classList.add('is-ready');
}

if (mount) init();
