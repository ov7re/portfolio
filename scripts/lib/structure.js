/**
 * Géométrie de la structure centrale.
 *
 * Une coupole assemblée en blocs modulaires : chaque bloc a une position
 * d'arrivée (sa place dans la coupole) et une position de départ (dispersé
 * dans l'espace). Le défilement fait passer de l'une à l'autre — métaphore
 * directe d'un projet qui se construit pièce par pièce.
 *
 * Tout est procédural : aucun modèle 3D à télécharger.
 */

const TAU = Math.PI * 2;

/** Générateur pseudo-aléatoire déterministe : même structure à chaque visite. */
function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/**
 * Construit la description des blocs.
 *
 * @param {object} [options]
 * @param {number} [options.radius]   rayon de la coupole
 * @param {number} [options.rings]    nombre de rangées
 * @param {number} [options.gapRing]  rangée où laisser l'ouverture (entrée)
 * @returns {Array} blocs : { size, target:{position,rotation}, start:{position,rotation}, delay, ring }
 */
export function buildStructure({ radius = 1, rings = 8, gapRing = 0, seed = 7 } = {}) {
  const random = seeded(seed);
  const blocks = [];

  // Hauteur angulaire d'une rangée : on s'arrête avant le zénith, la calotte
  // est fermée séparément.
  const topAngle = Math.PI / 2 - 0.16;
  const ringHeight = (topAngle / rings) * radius * 1.02;

  for (let ring = 0; ring < rings; ring += 1) {
    const phi = (ring / rings) * topAngle;
    const ringRadius = Math.cos(phi) * radius;
    const y = Math.sin(phi) * radius;

    // Largeur de bloc à peu près constante : les rangées hautes en ont moins.
    const targetWidth = radius * 0.3;
    const count = Math.max(4, Math.round((TAU * ringRadius) / targetWidth));
    const step = TAU / count;
    // Décalage d'une demi-brique par rangée, comme un vrai appareillage.
    const offset = ring * step * 0.5;

    for (let i = 0; i < count; i += 1) {
      // Ouverture : on retire deux blocs de la rangée du bas
      if (ring === gapRing && (i === 0 || i === 1)) continue;

      const theta = offset + i * step;
      const width = step * ringRadius * 0.88;
      const height = ringHeight * 0.86;
      const depth = radius * 0.17;

      blocks.push({
        ring,
        size: [width, height, depth],
        target: {
          position: [Math.cos(theta) * ringRadius, y + height * 0.5, Math.sin(theta) * ringRadius],
          rotation: [-phi, -theta + Math.PI / 2, 0],
        },
        // Départ : dispersé en couronne large, orientation quelconque
        start: {
          position: [
            Math.cos(theta + (random() - 0.5) * 1.3) * (radius * (1.7 + random() * 1.5)),
            radius * (0.35 + random() * 1.7),
            Math.sin(theta + (random() - 0.5) * 1.3) * (radius * (1.7 + random() * 1.5)),
          ],
          rotation: [random() * TAU, random() * TAU, random() * TAU],
        },
        // Les rangées basses se posent en premier : la structure monte.
        delay: (ring / rings) * 0.55 + random() * 0.14,
      });
    }
  }

  // Calotte : quelques blocs qui ferment le sommet
  const capCount = 5;
  const capRadius = Math.cos(topAngle) * radius * 0.62;
  const capY = Math.sin(topAngle) * radius;
  for (let i = 0; i < capCount; i += 1) {
    const theta = (i / capCount) * TAU;
    blocks.push({
      ring: rings,
      size: [radius * 0.24, ringHeight * 0.8, radius * 0.17],
      target: {
        position: [Math.cos(theta) * capRadius, capY + ringHeight * 0.3, Math.sin(theta) * capRadius],
        rotation: [-topAngle - 0.18, -theta + Math.PI / 2, 0],
      },
      start: {
        position: [
          Math.cos(theta) * radius * 2.2,
          radius * (1.9 + random() * 1.2),
          Math.sin(theta) * radius * 2.2,
        ],
        rotation: [random() * TAU, random() * TAU, random() * TAU],
      },
      delay: 0.62 + random() * 0.12,
    });
  }

  return blocks;
}

/**
 * Points d'un terrain bas et irrégulier autour de la structure.
 * Sert de socle : quelques reliefs suffisent à ancrer l'objet dans un décor.
 */
export function groundProfile(size, segments, amplitude = 0.18) {
  const random = seeded(31);
  const heights = new Float32Array((segments + 1) * (segments + 1));

  for (let z = 0; z <= segments; z += 1) {
    for (let x = 0; x <= segments; x += 1) {
      const u = (x / segments - 0.5) * size;
      const v = (z / segments - 0.5) * size;
      const distance = Math.hypot(u, v);

      // Bruit bon marché : quelques sinusoïdes déphasées
      const noise =
        Math.sin(u * 0.9 + 1.3) * Math.cos(v * 0.7 - 0.4) * 0.6 +
        Math.sin(u * 2.1 - 0.8) * Math.cos(v * 1.7 + 1.1) * 0.28 +
        (random() - 0.5) * 0.12;

      // Plat au centre pour poser la structure, relief au loin
      const mask = Math.min(1, Math.max(0, (distance - 1.6) / 3.4));
      heights[z * (segments + 1) + x] = noise * amplitude * mask;
    }
  }

  return heights;
}
