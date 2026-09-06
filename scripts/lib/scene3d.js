/**
 * Scène 3D cinématographique.
 *
 * Une structure faite de blocs modulaires, dispersés au chargement, qui
 * s'assemblent au fil du défilement pendant que la caméra traverse le décor.
 * Éclairage braise, sol réfléchissant, brouillard, floraison et grain :
 * l'objectif est une image de film, pas une démo technique.
 *
 * Le module est autonome. S'il ne peut pas démarrer (WebGL absent, CDN
 * bloqué), la page reste complète : la 3D n'est qu'une couche d'ambiance.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildStructure, groundProfile } from './structure.js';
import { prefersReducedMotion } from './dom.js';

/* ------------------------------------------------------------------ */
/* Réglages                                                           */
/* ------------------------------------------------------------------ */

const PALETTE = {
  ember: 0xff5a1f,
  brand: 0xd4162c,
  glow: 0xff9a3d,
  cold: 0x9fb4d0,
  block: 0x262b32,
  ground: 0x101316,
  fog: 0x08090b,
};

/** Variante claire : même décor, lumière de jour. */
const PALETTE_LIGHT = {
  ground: 0xd8d5d2,
  fog: 0xeceae8,
  block: 0x8f8b88,
  ambient: 0xffffff,
};

/** Trajectoire de la caméra, exprimée en progression de lecture (0 → 1). */
const CAMERA_PATH = [
  { at: 0.0, position: [-0.15, 1.15, 5.2], target: [-0.62, 0.74, 0] },
  { at: 0.2, position: [2.9, 1.45, 3.3], target: [0, 0.75, 0] },
  { at: 0.42, position: [3.5, 0.62, -2.5], target: [0, 0.6, 0] },
  { at: 0.62, position: [-1.35, 0.5, 2.15], target: [0, 0.55, 0] },
  { at: 0.82, position: [-4.1, 2.3, 5.0], target: [0, 0.7, 0] },
  { at: 1.0, position: [0.1, 3.3, 7.4], target: [0, 0.45, 0] },
];

/** Avancement de l'assemblage au repos : la structure n'est jamais éparpillée
 *  au point de disparaître dans le noir au premier écran. */
const ASSEMBLY_FLOOR = 0.68;
/** Progression de lecture à laquelle la structure est complète. */
const ASSEMBLY_END = 0.24;

const smoothstep = (t) => t * t * (3 - 2 * t);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Interpole la trajectoire de caméra à une progression donnée. */
function samplePath(progress, outPosition, outTarget) {
  let i = 0;
  while (i < CAMERA_PATH.length - 2 && progress > CAMERA_PATH[i + 1].at) i += 1;

  const a = CAMERA_PATH[i];
  const b = CAMERA_PATH[i + 1];
  const span = b.at - a.at || 1;
  const t = smoothstep(clamp01((progress - a.at) / span));

  outPosition.set(
    a.position[0] + (b.position[0] - a.position[0]) * t,
    a.position[1] + (b.position[1] - a.position[1]) * t,
    a.position[2] + (b.position[2] - a.position[2]) * t
  );
  outTarget.set(
    a.target[0] + (b.target[0] - a.target[0]) * t,
    a.target[1] + (b.target[1] - a.target[1]) * t,
    a.target[2] + (b.target[2] - a.target[2]) * t
  );
}

/* ------------------------------------------------------------------ */
/* Passe finale : vignette, grain, aberration chromatique             */
/* ------------------------------------------------------------------ */

const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 1.15 },
    uGrain: { value: 0.055 },
    uAberration: { value: 0.0018 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered);

      // Aberration chromatique : elle croît vers les bords, comme un objectif
      vec2 shift = centered * uAberration * (0.35 + dist * 2.0);
      vec4 color;
      color.r = texture2D(tDiffuse, vUv + shift).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - shift).b;
      color.a = 1.0;

      // Vignette
      color.rgb *= 1.0 - smoothstep(0.32, 0.92, dist) * uVignette * 0.72;

      // Grain argentique, animé pour ne pas figer un motif
      float grain = hash(vUv * 900.0 + fract(uTime) * 100.0) - 0.5;
      color.rgb += grain * uGrain;

      gl_FragColor = color;
    }
  `,
};

/* ------------------------------------------------------------------ */
/* Environnement                                                      */
/* ------------------------------------------------------------------ */

/**
 * Ciel procédural : sol noir, horizon braise, zénith sombre et chaud.
 * C'est lui qui donne aux blocs leurs reflets — un environnement studio
 * neutre les rendrait blancs et gris, ce qui casserait l'ambiance.
 */
function buildEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();

  const skyGeometry = new THREE.SphereGeometry(12, 32, 24);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uBottom: { value: new THREE.Color(0x040507) },
      uHorizon: { value: new THREE.Color(0xff5a1f) },
      uTop: { value: new THREE.Color(0x1d1116) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBottom;
      uniform vec3 uHorizon;
      uniform vec3 uTop;
      varying vec3 vPosition;
      void main() {
        float h = normalize(vPosition).y;
        vec3 color = mix(uBottom, uHorizon, smoothstep(-0.30, 0.04, h));
        color = mix(color, uTop, smoothstep(0.03, 0.62, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  envScene.add(sky);

  // Une source chaude marquée : sans elle, les arêtes des blocs n'accrochent
  // aucun reflet et la structure paraît plate.
  const spotGeometry = new THREE.SphereGeometry(2.4, 16, 12);
  const spot = new THREE.Mesh(
    spotGeometry,
    new THREE.MeshBasicMaterial({ color: 0xffd7a8 })
  );
  spot.position.set(6, 7, 4);
  envScene.add(spot);

  const texture = pmrem.fromScene(envScene, 0.03).texture;

  skyGeometry.dispose();
  skyMaterial.dispose();
  spotGeometry.dispose();
  spot.material.dispose();

  return { texture, pmrem };
}

/* ------------------------------------------------------------------ */
/* Scène                                                              */
/* ------------------------------------------------------------------ */

export function createScene(canvas) {
  if (!canvas) return null;

  const reduced = prefersReducedMotion();
  const small = window.innerWidth < 820;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !small,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return null; // WebGL indisponible : la page se passe très bien de la 3D
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.fog);
  scene.fog = new THREE.Fog(PALETTE.fog, 8.5, 24);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 60);

  /* --- Environnement : réflexions braise, sans fichier à charger --- */
  const { texture: environment, pmrem } = buildEnvironment(renderer);
  scene.environment = environment;

  /* --- Lumières --- */
  const key = new THREE.DirectionalLight(PALETTE.ember, 3.4);
  key.position.set(2.6, 3.4, 2.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(PALETTE.cold, 1.6);
  rim.position.set(-3.2, 1.6, -2.8);
  scene.add(rim);

  const ambient = new THREE.AmbientLight(0x2c3240, 1.15);
  scene.add(ambient);

  // Contre-jour large : sans lui, les blocs dispersés du plan d'ouverture
  // n'accrochent aucune lumière et l'écran reste noir.
  const fill = new THREE.HemisphereLight(0x5a3a2a, 0x0a0b0d, 0.85);
  scene.add(fill);

  // Le foyer, à l'intérieur de la structure : c'est lui qui « allume » la scène
  const core = new THREE.PointLight(PALETTE.glow, 9, 11, 1.7);
  core.position.set(0, 0.42, 0);
  scene.add(core);

  const coreMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 20, 16),
    new THREE.MeshBasicMaterial({ color: PALETTE.glow })
  );
  coreMesh.position.copy(core.position);
  scene.add(coreMesh);

  /* --- Sol --- */
  const groundSegments = small ? 48 : 96;
  const groundSize = 26;
  const groundGeometry = new THREE.PlaneGeometry(
    groundSize,
    groundSize,
    groundSegments,
    groundSegments
  );
  const heights = groundProfile(groundSize, groundSegments, 0.9);
  const groundPositions = groundGeometry.attributes.position;
  for (let i = 0; i < groundPositions.count; i += 1) {
    groundPositions.setZ(i, heights[i]);
  }
  groundGeometry.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeometry,
    new THREE.MeshStandardMaterial({
      color: PALETTE.ground,
      roughness: 0.78,
      metalness: 0.18,
      envMapIntensity: 0.6,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  /* --- Structure en blocs --- */
  const blocks = buildStructure({ radius: 1, rings: small ? 6 : 8, gapRing: 0 });
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  blockGeometry.translate(0, 0, 0);

  // Métal modéré : au-delà, les blocs perdent toute composante diffuse et
  // disparaissent dans le noir dès qu'ils sortent du halo du foyer.
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.block,
    roughness: 0.55,
    metalness: 0.34,
    envMapIntensity: 1.0,
  });

  const mesh = new THREE.InstancedMesh(blockGeometry, blockMaterial, blocks.length);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Quaternions pré-calculés : on ne recrée rien dans la boucle
  const euler = new THREE.Euler();
  const prepared = blocks.map((block) => {
    euler.set(...block.start.rotation);
    const startQuat = new THREE.Quaternion().setFromEuler(euler);
    euler.set(...block.target.rotation);
    const targetQuat = new THREE.Quaternion().setFromEuler(euler);
    return {
      size: new THREE.Vector3(...block.size),
      startPos: new THREE.Vector3(...block.start.position),
      targetPos: new THREE.Vector3(...block.target.position),
      startQuat,
      targetQuat,
      delay: block.delay,
    };
  });

  const dummy = new THREE.Object3D();
  const tmpQuat = new THREE.Quaternion();

  /** Place les blocs selon l'avancement de l'assemblage (0 → 1). */
  function applyAssembly(value) {
    for (let i = 0; i < prepared.length; i += 1) {
      const b = prepared[i];
      // Chaque bloc démarre à son propre moment : la structure monte du sol
      const local = smoothstep(clamp01((value - b.delay) / (1 - b.delay || 1)));

      dummy.position.lerpVectors(b.startPos, b.targetPos, local);
      tmpQuat.copy(b.startQuat).slerp(b.targetQuat, local);
      dummy.quaternion.copy(tmpQuat);
      const scale = 0.35 + local * 0.65;
      dummy.scale.set(b.size.x * scale, b.size.y * scale, b.size.z * scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /* --- Post-traitement --- */
  const usePost = !small;
  let composer = null;
  let finishPass = null;
  let bloomPass = null;

  if (usePost) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.95, // intensité
      0.75, // rayon
      0.32 // seuil : au-dessus, le foyer ne débordait pas du tout
    );
    composer.addPass(bloomPass);

    finishPass = new ShaderPass(FinishShader);
    composer.addPass(finishPass);
    composer.addPass(new OutputPass());
  }

  /* --- État --- */
  let running = false;
  let frame = 0;
  let elapsed = 0;
  let lastTime = performance.now();

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const progress = { value: 0, target: 0 };
  const energy = { value: 0, target: 0 };
  const reveal = { value: 0, target: 0 };

  const camPosition = new THREE.Vector3();
  const camTarget = new THREE.Vector3();

  /** Ajusté par setTheme : la version claire demande moins d'exposition. */
  let exposureScale = 1;

  /* --- Thème --- */
  let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

  /**
   * Bascule jour / nuit. Sans cela, la scène nocturne resterait un trou noir
   * au milieu d'une page claire.
   */
  function setTheme(next) {
    theme = next === 'light' ? 'light' : 'dark';
    const light = theme === 'light';

    const fogColor = light ? PALETTE_LIGHT.fog : PALETTE.fog;
    scene.background.setHex(fogColor);
    scene.fog.color.setHex(fogColor);
    ground.material.color.setHex(light ? PALETTE_LIGHT.ground : PALETTE.ground);
    blockMaterial.color.setHex(light ? PALETTE_LIGHT.block : PALETTE.block);
    ambient.color.setHex(light ? PALETTE_LIGHT.ambient : 0x2c3240);
    exposureScale = light ? 0.72 : 1;
    draw();
  }


  /* --- Boucle --- */

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    // Sur écran étroit, on recule pour garder la structure entière
    camera.fov = width < 700 ? 56 : 42;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (composer) composer.setSize(width, height);
    if (bloomPass) bloomPass.resolution.set(width, height);
    draw();
  }

  function draw() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function tick(now) {
    if (!running) return;
    frame = requestAnimationFrame(tick);

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += delta;

    // Amortissements : le défilement pousse, la scène suit sans à-coup
    progress.value += (progress.target - progress.value) * (1 - Math.pow(0.006, delta));
    energy.value += (energy.target - energy.value) * (1 - Math.pow(0.02, delta));
    reveal.value += (reveal.target - reveal.value) * (1 - Math.pow(0.05, delta));
    pointer.x += (pointer.targetX - pointer.x) * (1 - Math.pow(0.002, delta));
    pointer.y += (pointer.targetY - pointer.y) * (1 - Math.pow(0.002, delta));

    // L'assemblage se joue sur le premier quart de la page
    applyAssembly(ASSEMBLY_FLOOR + (1 - ASSEMBLY_FLOOR) * clamp01(progress.value / ASSEMBLY_END));

    samplePath(progress.value, camPosition, camTarget);
    camera.position.set(
      camPosition.x + pointer.x * 0.38,
      camPosition.y - pointer.y * 0.22,
      camPosition.z
    );
    camera.lookAt(camTarget);

    // Le foyer respire, et s'intensifie quand on défile vite
    const pulse = 0.86 + Math.sin(elapsed * 1.7) * 0.07 + energy.value * 0.5;
    core.intensity = 9 * pulse * reveal.value;
    coreMesh.scale.setScalar(0.8 + pulse * 0.25);
    coreMesh.material.color.setHex(PALETTE.glow);
    key.intensity = 3.4 * reveal.value;
    rim.intensity = 1.6 * reveal.value;
    ambient.intensity = 1.15 * reveal.value;
    fill.intensity = 0.85 * reveal.value;

    renderer.toneMappingExposure = 1.5 * exposureScale * (0.25 + reveal.value * 0.75);

    if (finishPass) finishPass.uniforms.uTime.value = elapsed;

    draw();

    energy.target *= 0.92;
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

  /* --- Entrées --- */
  const onPointerMove = (event) => {
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1;
    start();
  };

  const onVisibility = () => (document.hidden ? stop() : start());

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  setTheme(theme);
  resize();

  if (reduced) {
    // Mouvement réduit : une seule image, structure assemblée, caméra fixe.
    reveal.value = 1;
    progress.value = 0.12;
    applyAssembly(1);
    samplePath(0.12, camPosition, camTarget);
    camera.position.copy(camPosition);
    camera.lookAt(camTarget);
    core.intensity = 9;
    draw();
  } else {
    applyAssembly(ASSEMBLY_FLOOR);
    draw();
  }

  return {
    setTheme,
    /**
     * Fait apparaître la scène (0 → 1).
     * `instant` court-circuite l'amortissement : utile au chargement direct
     * sur une ancre, ou pour régler la scène.
     */
    show(value = 1, instant = false) {
      reveal.target = value;
      if (instant || reduced) {
        reveal.value = value;
        draw();
      }
      if (!reduced) start();
    },
    /** Progression de lecture de la page (0 → 1) : pilote caméra et assemblage. */
    setProgress(value, instant = false) {
      progress.target = clamp01(value);
      if (instant) {
        progress.value = progress.target;
        applyAssembly(ASSEMBLY_FLOOR + (1 - ASSEMBLY_FLOOR) * clamp01(progress.value / ASSEMBLY_END));
        samplePath(progress.value, camPosition, camTarget);
        camera.position.copy(camPosition);
        camera.lookAt(camTarget);
        draw();
      }
      if (!reduced) start();
    },
    /** Énergie injectée par la vitesse de défilement (0 → 1). */
    setEnergy(value) {
      energy.target = Math.max(energy.target, Math.min(Math.abs(value), 1));
      if (!reduced) start();
    },
    reduced,
    blockCount: blocks.length,
    dispose() {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      blockGeometry.dispose();
      blockMaterial.dispose();
      groundGeometry.dispose();
      ground.material.dispose();
      coreMesh.geometry.dispose();
      coreMesh.material.dispose();
      environment.dispose();
      pmrem.dispose();
      composer?.dispose?.();
      renderer.dispose();
    },
  };
}
