/**
 * Formes du nuage de points 3D.
 *
 * Chaque générateur renvoie un Float32Array de `count * 3` coordonnées.
 * Les points gardent le même index d'une forme à l'autre : la transition est
 * donc une simple interpolation, et le nuage semble se réorganiser plutôt que
 * disparaître puis réapparaître.
 *
 * Repère : le nuage tient dans un cube d'environ 2 unités de côté.
 */

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/** Générateur pseudo-aléatoire déterministe : même rendu à chaque visite. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Répartit `count` points le long d'une polyligne, avec une épaisseur. */
function alongPolyline(points, count, { radius = 0.07, depth = 0.16, seed = 1 } = {}) {
  const random = seeded(seed);
  const out = new Float32Array(count * 3);

  const lengths = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const length = Math.hypot(bx - ax, by - ay);
    lengths.push(length);
    total += length;
  }

  for (let i = 0; i < count; i += 1) {
    // Position le long de la polyligne, pondérée par la longueur des segments
    let distance = (i / count) * total;
    let segment = 0;
    while (segment < lengths.length - 1 && distance > lengths[segment]) {
      distance -= lengths[segment];
      segment += 1;
    }
    const t = lengths[segment] ? distance / lengths[segment] : 0;
    const [ax, ay] = points[segment];
    const [bx, by] = points[segment + 1];

    // Dispersion en disque autour de l'axe, pour donner de l'épaisseur au trait
    const angle = random() * TAU;
    const spread = Math.sqrt(random()) * radius;

    out[i * 3] = ax + (bx - ax) * t + Math.cos(angle) * spread;
    out[i * 3 + 1] = ay + (by - ay) * t + Math.sin(angle) * spread;
    out[i * 3 + 2] = (random() - 0.5) * depth * 2;
  }

  return out;
}

/** Le « 7 » de la marque, en volume. */
export function glyphSeven(count) {
  return alongPolyline(
    [
      [-0.62, 0.8],
      [0.62, 0.8],
      [-0.04, -0.85],
    ],
    count,
    { radius: 0.075, depth: 0.2, seed: 7 }
  );
}

/** Deux amas en orbite : les deux pôles d'activité. */
export function dualClusters(count) {
  const random = seeded(21);
  const out = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    // Distribution en coquille : dense en surface, creuse au centre
    const radius = 0.34 + Math.pow(random(), 1.6) * 0.16;
    const theta = random() * TAU;
    const phi = Math.acos(2 * random() - 1);

    out[i * 3] = side * 0.62 + radius * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.9;
    out[i * 3 + 2] = radius * Math.cos(phi);
  }

  return out;
}

/** Double hélice : le projet qui avance étape par étape. */
export function helix(count) {
  const random = seeded(33);
  const out = new Float32Array(count * 3);
  const turns = 3.2;

  for (let i = 0; i < count; i += 1) {
    const t = i / count;
    const strand = i % 2 === 0 ? 0 : Math.PI;
    const angle = t * TAU * turns + strand;
    const radius = 0.42 + (random() - 0.5) * 0.06;

    out[i * 3] = (t - 0.5) * 2.3;
    out[i * 3 + 1] = Math.sin(angle) * radius;
    out[i * 3 + 2] = Math.cos(angle) * radius;
  }

  return out;
}

/** Trame régulière : l'architecture, la structure d'un projet. */
export function lattice(count) {
  const random = seeded(48);
  const out = new Float32Array(count * 3);
  const side = Math.ceil(Math.cbrt(count));
  const step = 1.7 / (side - 1);

  for (let i = 0; i < count; i += 1) {
    const x = i % side;
    const y = Math.floor(i / side) % side;
    const z = Math.floor(i / (side * side)) % side;
    const jitter = 0.022;

    out[i * 3] = -0.85 + x * step + (random() - 0.5) * jitter;
    out[i * 3 + 1] = -0.85 + y * step + (random() - 0.5) * jitter;
    out[i * 3 + 2] = -0.85 + z * step + (random() - 0.5) * jitter;
  }

  return out;
}

/** Constellation sphérique : la stack, répartie uniformément. */
export function constellation(count) {
  const random = seeded(64);
  const out = new Float32Array(count * 3);

  for (let i = 0; i < count; i += 1) {
    // Répartition de Fibonacci : aucun amas, aucun trou
    const y = 1 - (i / (count - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = GOLDEN * i;
    const scale = 0.88 + (random() - 0.5) * 0.05;

    out[i * 3] = Math.cos(theta) * radius * scale;
    out[i * 3 + 1] = y * scale;
    out[i * 3 + 2] = Math.sin(theta) * radius * scale;
  }

  return out;
}

/** Champ d'ondes : une surface calme, presque au repos. */
export function waveField(count) {
  const random = seeded(87);
  const out = new Float32Array(count * 3);
  const side = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i += 1) {
    const gx = (i % side) / (side - 1);
    const gz = Math.floor(i / side) / (side - 1);
    const x = (gx - 0.5) * 2.4;
    const z = (gz - 0.5) * 2.4;

    out[i * 3] = x + (random() - 0.5) * 0.02;
    out[i * 3 + 1] = Math.sin(x * 2.4) * 0.16 + Math.cos(z * 2.1) * 0.14;
    out[i * 3 + 2] = z + (random() - 0.5) * 0.02;
  }

  return out;
}

/**
 * Séquence des formes, dans l'ordre de lecture de la page.
 * L'identifiant correspond à la section qui déclenche la transformation.
 */
export const shapeSequence = [
  { id: 'accueil', build: glyphSeven },
  { id: 'services', build: dualClusters },
  { id: 'methode', build: helix },
  { id: 'projets', build: lattice },
  { id: 'technologies', build: constellation },
  { id: 'a-propos', build: waveField },
  { id: 'contact', build: glyphSeven },
];

/** Construit toutes les formes pour un nombre de points donné. */
export function buildShapes(count) {
  return shapeSequence.map(({ id, build }) => ({ id, positions: build(count) }));
}
