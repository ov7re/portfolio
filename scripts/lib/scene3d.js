/**
 * Scène 3D persistante.
 *
 * Un seul nuage de points en WebGL, fixé derrière toute la page. Il ne
 * disparaît jamais : il change de forme au fil des sections, ce qui donne au
 * site un fil visuel continu du hero jusqu'au contact.
 *
 * Le module est autonome : il n'a besoin ni de GSAP ni du reste du site.
 * S'il ne peut pas démarrer (WebGL absent, Three.js bloqué), la page reste
 * complète et lisible — la 3D n'est qu'une couche d'ambiance.
 */

import * as THREE from 'three';
import { buildShapes, shapeSequence } from './shapes.js';
import { prefersReducedMotion } from './dom.js';

/* ------------------------------------------------------------------ */
/* Shaders                                                            */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMix;
  uniform float uEnergy;
  uniform float uSize;
  uniform float uRefDist;
  uniform float uPixelRatio;

  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;

  varying float vSeed;
  varying float vFade;

  // Turbulence très bon marché : trois sinusoïdes déphasées suffisent à
  // donner de la vie sans coûter un vrai bruit de Perlin.
  vec3 turbulence(vec3 p, float t) {
    return vec3(
      sin(p.y * 2.1 + t * 0.70),
      cos(p.z * 1.9 + t * 0.62),
      sin(p.x * 2.3 + t * 0.81)
    );
  }

  void main() {
    // Chaque point part avec un léger retard : la transformation traverse le
    // nuage comme une vague au lieu de basculer d'un bloc.
    float lag = clamp((uMix - aSeed * 0.34) / 0.66, 0.0, 1.0);
    float eased = lag * lag * (3.0 - 2.0 * lag);

    vec3 pos = mix(aFrom, aTo, eased);

    // Les points s'écartent au milieu de la transition, puis se rangent.
    float burst = sin(eased * 3.14159265);
    float amplitude = 0.085 * burst + 0.014 + uEnergy * 0.055;
    pos += turbulence(pos * 1.6, uTime * 0.35) * amplitude;

    vec4 viewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    // uSize est une taille en pixels à la distance de référence uRefDist :
    // les points gardent la même présence quelle que soit la caméra.
    gl_PointSize = uSize * uPixelRatio * (1.0 + burst * 0.55) * (uRefDist / max(0.35, -viewPosition.z));

    vSeed = aSeed;
    vFade = clamp((-viewPosition.z - 1.6) / 3.4, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;

  varying float vSeed;
  varying float vFade;

  void main() {
    // Point rond à bord doux, sans texture à charger.
    vec2 offset = gl_PointCoord - 0.5;
    float falloff = smoothstep(0.25, 0.0, dot(offset, offset));
    if (falloff <= 0.001) discard;

    vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.62, vSeed));
    color = mix(color, uColorC, smoothstep(0.62, 1.0, vSeed));

    // Les points lointains s'effacent : de la profondeur sans brouillard.
    float depthFade = mix(1.0, 0.28, vFade);

    gl_FragColor = vec4(color, falloff * uOpacity * depthFade);
  }
`;

/* ------------------------------------------------------------------ */
/* Scène                                                              */
/* ------------------------------------------------------------------ */

const MORPH_DURATION = 1500; // ms — une transformation « révélation » assumée
const DESKTOP_POINTS = 7000;
const MOBILE_POINTS = 2600;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createScene(canvas) {
  if (!canvas) return null;

  const reduced = prefersReducedMotion();
  const count = window.innerWidth < 820 ? MOBILE_POINTS : DESKTOP_POINTS;
  const shapes = buildShapes(count);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null; // WebGL indisponible : la page se passe très bien de la 3D
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0, 3.35);

  /* --- Géométrie : deux jeux de positions, plus une graine par point --- */
  const geometry = new THREE.BufferGeometry();
  const from = new Float32Array(shapes[0].positions);
  const to = new Float32Array(shapes[0].positions);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) seeds[i] = Math.random();

  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(from), 3));
  geometry.setAttribute('aFrom', new THREE.BufferAttribute(from, 3));
  geometry.setAttribute('aTo', new THREE.BufferAttribute(to, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 1 },
    uEnergy: { value: 0 },
    uSize: { value: 3.4 },
    uRefDist: { value: 3.35 },
    uPixelRatio: { value: pixelRatio },
    uOpacity: { value: 0 },
    uColorA: { value: new THREE.Color('#d4162c') },
    uColorB: { value: new THREE.Color('#ff5a1f') },
    uColorC: { value: new THREE.Color('#ff9a3d') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  /* --- État --- */
  let currentShape = 0;
  let morphStart = 0;
  let morphing = false;
  let running = false;
  let frame = 0;
  let lastTime = performance.now();
  let elapsed = 0;

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const spin = { value: 0, target: 0 };
  const energy = { value: 0, target: 0 };
  const reveal = { value: 0, target: 0 };

  /* --- Transformations --- */

  /** Fige l'état interpolé courant : une transition peut en interrompre une autre. */
  function snapshotInto(target) {
    const fromAttr = geometry.getAttribute('aFrom');
    const toAttr = geometry.getAttribute('aTo');
    const mix = uniforms.uMix.value;

    for (let i = 0; i < target.length; i += 1) {
      const a = fromAttr.array[i];
      const b = toAttr.array[i];
      target[i] = a + (b - a) * mix;
    }
  }

  function morphTo(index) {
    const next = ((index % shapes.length) + shapes.length) % shapes.length;
    if (next === currentShape && uniforms.uMix.value === 1) return;

    const fromAttr = geometry.getAttribute('aFrom');
    const toAttr = geometry.getAttribute('aTo');

    snapshotInto(fromAttr.array);
    toAttr.array.set(shapes[next].positions);
    fromAttr.needsUpdate = true;
    toAttr.needsUpdate = true;

    currentShape = next;

    if (reduced) {
      uniforms.uMix.value = 1;
      morphing = false;
      render();
      return;
    }

    uniforms.uMix.value = 0;
    morphStart = performance.now();
    morphing = true;
    start();
  }

  /* --- Boucle --- */

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    // Le nuage recule un peu sur les écrans étroits pour rester entier
    camera.position.z = width < 700 ? 4.15 : 3.35;
    uniforms.uRefDist.value = camera.position.z;
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  function tick(now) {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += delta;
    uniforms.uTime.value = elapsed;

    if (morphing) {
      const progress = Math.min((now - morphStart) / MORPH_DURATION, 1);
      uniforms.uMix.value = easeInOutCubic(progress);
      if (progress === 1) morphing = false;
    }

    // Amortissements : rien ne bouge d'un coup, tout rejoint sa cible
    const damp = 1 - Math.pow(0.001, delta);
    pointer.x += (pointer.targetX - pointer.x) * damp;
    pointer.y += (pointer.targetY - pointer.y) * damp;
    energy.value += (energy.target - energy.value) * (1 - Math.pow(0.02, delta));
    spin.value += (spin.target - spin.value) * (1 - Math.pow(0.05, delta));
    reveal.value += (reveal.target - reveal.value) * (1 - Math.pow(0.08, delta));

    uniforms.uEnergy.value = energy.value;
    uniforms.uOpacity.value = reveal.value * opacityForTheme();

    // Couche ambiante : une rotation lente et continue, jamais nulle
    group.rotation.y = spin.value + elapsed * 0.045;
    group.rotation.x = pointer.y * 0.22 + Math.sin(elapsed * 0.22) * 0.03;
    group.rotation.z = pointer.x * 0.06;
    camera.position.x = pointer.x * 0.32;
    camera.position.y = pointer.y * -0.22;
    camera.lookAt(0, 0, 0);

    render();

    // Au repos complet, on arrête la boucle : plus une image calculée pour rien
    energy.target *= 0.9;
    if (
      !morphing &&
      energy.value < 0.002 &&
      Math.abs(reveal.value - reveal.target) < 0.002 &&
      document.hidden
    ) {
      stop();
    }
  }

  function start() {
    if (running || reduced) return;
    running = true;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  /* --- Thème --- */
  let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

  function opacityForTheme() {
    // Sur fond clair, l'additif brûle : on passe en mélange normal, plus discret
    return theme === 'light' ? 0.5 : 0.85;
  }

  function setTheme(next) {
    theme = next === 'light' ? 'light' : 'dark';
    material.blending = theme === 'light' ? THREE.NormalBlending : THREE.AdditiveBlending;
    uniforms.uColorA.value.set(theme === 'light' ? '#a50f22' : '#d4162c');
    uniforms.uColorB.value.set(theme === 'light' ? '#d4162c' : '#ff5a1f');
    uniforms.uColorC.value.set(theme === 'light' ? '#ff5a1f' : '#ff9a3d');
    material.needsUpdate = true;
    render();
  }

  /* --- Entrées --- */
  const onPointerMove = (event) => {
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    start();
  };

  const onVisibility = () => {
    if (document.hidden) stop();
    else start();
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  setTheme(theme);
  resize();

  if (reduced) {
    uniforms.uOpacity.value = opacityForTheme() * 0.55;
    render();
  }

  return {
    /** Fait apparaître le nuage (0 → 1). */
    show(value = 1) {
      reveal.target = value;
      if (reduced) {
        uniforms.uOpacity.value = value * opacityForTheme();
        render();
        return;
      }
      start();
    },
    /** Transforme le nuage vers la forme d'index donné. */
    morphTo,
    /** Index de la forme correspondant à un identifiant de section. */
    indexOf(id) {
      return shapeSequence.findIndex((shape) => shape.id === id);
    },
    /** Énergie injectée par la vitesse de défilement (0 → 1). */
    setEnergy(value) {
      energy.target = Math.max(energy.target, Math.min(Math.abs(value), 1));
      start();
    },
    /** Rotation supplémentaire pilotée par le défilement. */
    setSpin(value) {
      spin.target = value;
      start();
    },
    setTheme,
    reduced,
    shapeCount: shapes.length,
    dispose() {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
