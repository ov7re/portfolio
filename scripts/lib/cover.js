/**
 * Illustrations de projet générées en SVG inline.
 *
 * Aucune capture d'écran n'est inventée : ces visuels sont volontairement
 * abstraits et ne prétendent pas montrer l'interface réelle d'un projet.
 * Ils sont générés côté client (aucune requête réseau) et suivent le thème
 * grâce aux variables CSS.
 */

const W = 640;
const H = 400;

const base = `
  <rect width="${W}" height="${H}" fill="var(--bg-soft)"/>
  <g opacity=".5">
    <path d="M0 0h${W}v${H}H0z" fill="url(#ov7-grid)"/>
  </g>
  <circle cx="${W * 0.82}" cy="${H * 0.18}" r="150" fill="url(#ov7-glow)"/>
`;

const defs = `
  <defs>
    <pattern id="ov7-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0v40" fill="none" stroke="var(--line)" stroke-width="1"/>
    </pattern>
    <radialGradient id="ov7-glow">
      <stop offset="0%" stop-color="var(--brand)" stop-opacity=".22"/>
      <stop offset="100%" stop-color="var(--brand)" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ov7-edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="var(--brand)"/>
      <stop offset="100%" stop-color="var(--brand-ember)"/>
    </linearGradient>
  </defs>
`;

/** Barre de fenêtre réutilisée par plusieurs motifs. */
function windowFrame(x, y, w, h, accent = false) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"
            fill="var(--surface)" stroke="${accent ? 'url(#ov7-edge)' : 'var(--line-strong)'}" stroke-width="1.5"/>
      <path d="M${x} ${y + 26}h${w}" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="${x + 16}" cy="${y + 13}" r="3.5" fill="${accent ? 'var(--brand)' : 'var(--text-3)'}" opacity=".9"/>
      <circle cx="${x + 28}" cy="${y + 13}" r="3.5" fill="var(--text-3)" opacity=".45"/>
      <circle cx="${x + 40}" cy="${y + 13}" r="3.5" fill="var(--text-3)" opacity=".45"/>
    </g>
  `;
}

/** Lignes horizontales façon contenu, largeurs variables mais déterministes. */
function contentLines(x, y, widths, gap = 16, color = 'var(--text-3)') {
  return widths
    .map(
      (w, i) =>
        `<rect x="${x}" y="${y + i * gap}" width="${w}" height="6" rx="3" fill="${color}" opacity="${
          i === 0 ? '.55' : '.28'
        }"/>`
    )
    .join('');
}

const motifs = {
  /* Fenêtres applicatives superposées — logiciels desktop */
  desktop: () => `
    ${windowFrame(70, 70, 330, 200)}
    ${contentLines(96, 118, [180, 140, 210, 120])}
    ${windowFrame(230, 150, 340, 190, true)}
    ${contentLines(256, 198, [200, 250, 160])}
    <rect x="256" y="270" width="86" height="26" rx="7" fill="var(--brand)" opacity=".85"/>
    <rect x="352" y="270" width="86" height="26" rx="7" fill="var(--surface-3)"/>
  `,

  /* Terminal — outils en ligne de commande */
  terminal: () => `
    ${windowFrame(80, 80, 480, 240, true)}
    <g font-family="monospace" font-size="13" fill="var(--text-3)">
      <text x="106" y="132" fill="var(--brand-ember)">&gt;</text>
      ${contentLines(124, 126, [150], 26)}
      <text x="106" y="164" fill="var(--brand-ember)">&gt;</text>
      ${contentLines(124, 158, [220], 26)}
      ${contentLines(106, 190, [280, 190], 24, 'var(--text-2)')}
      <text x="106" y="262" fill="var(--brand-ember)">&gt;</text>
      <rect x="124" y="252" width="12" height="14" fill="var(--brand-ember)" opacity=".9"/>
    </g>
  `,

  /* Nœuds reliés — réseau, routage, sécurité */
  network: () => `
    <g stroke="var(--line-strong)" stroke-width="1.5" fill="none">
      <path d="M120 300 L215 190 L330 250 L450 140 L540 210"/>
      <path d="M215 190 L330 110 L450 140"/>
      <path d="M330 250 L330 110"/>
    </g>
    <g stroke="url(#ov7-edge)" stroke-width="2.5" fill="none">
      <path d="M120 300 L215 190 L330 250 L450 140"/>
    </g>
    ${[
      [120, 300, 9],
      [215, 190, 11],
      [330, 250, 9],
      [330, 110, 8],
      [450, 140, 13],
      [540, 210, 8],
    ]
      .map(
        ([cx, cy, r], i) =>
          `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--surface)" stroke="${
            i === 4 ? 'var(--brand)' : 'var(--line-strong)'
          }" stroke-width="2"/>`
      )
      .join('')}
    <circle cx="450" cy="140" r="26" fill="none" stroke="var(--brand)" stroke-width="1.5" opacity=".35"/>
    <circle cx="450" cy="140" r="40" fill="none" stroke="var(--brand)" stroke-width="1" opacity=".18"/>
  `,

  /* Loupe et résultats — recherche, indexation */
  search: () => `
    ${windowFrame(210, 70, 360, 260)}
    <rect x="236" y="120" width="200" height="26" rx="13" fill="var(--surface-2)" stroke="var(--line-strong)"/>
    <rect x="446" y="120" width="72" height="26" rx="13" fill="var(--brand)" opacity=".85"/>
    ${[0, 1, 2, 3]
      .map(
        (i) =>
          `<g><rect x="236" y="${170 + i * 34}" width="282" height="24" rx="6" fill="var(--surface-2)"/>` +
          `<rect x="248" y="${179 + i * 34}" width="${150 - i * 22}" height="6" rx="3" fill="var(--text-3)" opacity=".4"/></g>`
      )
      .join('')}
    <g transform="translate(78 160)">
      <circle cx="46" cy="46" r="42" fill="var(--surface)" stroke="url(#ov7-edge)" stroke-width="3"/>
      <path d="M78 78 L112 112" stroke="url(#ov7-edge)" stroke-width="8" stroke-linecap="round"/>
    </g>
  `,

  /* Bouclier et clé — chiffrement, contrôle d'accès */
  lock: () => `
    <g transform="translate(232 76)">
      <path d="M88 0 L172 30 v78c0 56-38 96-84 112C42 204 4 164 4 108V30L88 0Z"
            fill="var(--surface)" stroke="url(#ov7-edge)" stroke-width="2.5"/>
      <rect x="58" y="92" width="60" height="52" rx="9" fill="var(--brand)" opacity=".16"/>
      <path d="M70 92V76a18 18 0 0 1 36 0v16" fill="none" stroke="var(--brand-ember)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="88" cy="114" r="7" fill="var(--brand-ember)"/>
      <path d="M88 121v12" stroke="var(--brand-ember)" stroke-width="5" stroke-linecap="round"/>
    </g>
    ${contentLines(80, 150, [96, 68, 110], 22)}
    ${contentLines(470, 150, [96, 120, 74], 22)}
  `,

  /* Bulles et nœud central — bots, automatisation */
  bot: () => `
    <g>
      <rect x="228" y="128" width="184" height="144" rx="26" fill="var(--surface)" stroke="url(#ov7-edge)" stroke-width="2"/>
      <circle cx="286" cy="188" r="11" fill="var(--brand-ember)"/>
      <circle cx="354" cy="188" r="11" fill="var(--brand-ember)"/>
      <path d="M282 228h76" stroke="var(--text-3)" stroke-width="5" stroke-linecap="round" opacity=".5"/>
      <path d="M320 128V98" stroke="var(--line-strong)" stroke-width="3"/>
      <circle cx="320" cy="90" r="9" fill="var(--brand)"/>
      <rect x="196" y="168" width="24" height="52" rx="12" fill="var(--surface-2)" stroke="var(--line-strong)"/>
      <rect x="420" y="168" width="24" height="52" rx="12" fill="var(--surface-2)" stroke="var(--line-strong)"/>
    </g>
    <g fill="var(--surface)" stroke="var(--line-strong)" stroke-width="1.5">
      <path d="M74 108h130a10 10 0 0 1 10 10v40a10 10 0 0 1-10 10H104l-22 20v-20h-8a10 10 0 0 1-10-10v-40a10 10 0 0 1 10-10Z"/>
      <path d="M566 232H436a10 10 0 0 0-10 10v40a10 10 0 0 0 10 10h100l22 20v-20h8a10 10 0 0 0 10-10v-40a10 10 0 0 0-10-10Z"/>
    </g>
    ${contentLines(94, 128, [90, 60], 18)}
    ${contentLines(452, 252, [86, 56], 18)}
  `,

  /* Véhicules et places — systèmes de garage FiveM */
  vehicle: () => `
    <g stroke="var(--line-strong)" stroke-width="1.5" fill="none">
      ${[0, 1, 2, 3]
        .map((i) => `<rect x="${88 + i * 120}" y="96" width="104" height="208" rx="10" fill="var(--surface)"/>`)
        .join('')}
    </g>
    <g transform="translate(208 150)">
      <rect x="0" y="40" width="104" height="46" rx="14" fill="var(--brand)" opacity=".9"/>
      <path d="M16 40 L32 12h40l16 28" fill="var(--surface-2)" stroke="var(--brand-ember)" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="26" cy="90" r="12" fill="var(--surface-3)" stroke="var(--text-3)" stroke-width="3"/>
      <circle cx="78" cy="90" r="12" fill="var(--surface-3)" stroke="var(--text-3)" stroke-width="3"/>
    </g>
    ${[0, 2, 3]
      .map(
        (i) =>
          `<g opacity=".5"><rect x="${104 + i * 120}" y="190" width="72" height="34" rx="10" fill="var(--surface-3)"/>` +
          `<circle cx="${122 + i * 120}" cy="228" r="9" fill="var(--surface-2)" stroke="var(--text-3)" stroke-width="2"/>` +
          `<circle cx="${158 + i * 120}" cy="228" r="9" fill="var(--surface-2)" stroke="var(--text-3)" stroke-width="2"/></g>`
      )
      .join('')}
    <path d="M64 330h512" stroke="var(--line-strong)" stroke-width="2" stroke-dasharray="18 14"/>
  `,
};

/**
 * Renvoie le SVG d'illustration d'un projet.
 * @param {string} motif  clé de motif ; un motif inconnu retombe sur `desktop`
 */
export function projectCover(motif) {
  const draw = motifs[motif] || motifs.desktop;
  return `<svg viewBox="0 0 ${W} ${H}" role="presentation" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${defs}${base}${draw()}</svg>`;
}

export const motifNames = Object.keys(motifs);
