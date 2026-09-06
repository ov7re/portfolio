/**
 * Jeu d'icônes inline (SVG 24x24, tracé uniquement).
 * Aucune librairie externe : les icônes sont injectées dans le HTML au rendu.
 * Ajouter une icône = ajouter une entrée ici, puis l'appeler par sa clé.
 */

const paths = {
  gamepad:
    '<path d="M6.5 9h11a4.5 4.5 0 0 1 4.4 5.4l-.7 3.3A2.6 2.6 0 0 1 18.7 19c-.9 0-1.7-.5-2.1-1.3L15.8 16H8.2l-.8 1.7A2.4 2.4 0 0 1 5.3 19a2.6 2.6 0 0 1-2.5-2.3l-.7-3.3A4.5 4.5 0 0 1 6.5 9Z"/><path d="M8 12v2M7 13h2M15.5 12.5h.01M17.5 14.5h.01"/>',
  cube:
    '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
  blocks:
    '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  discord:
    '<path d="M8.5 8.2A12 12 0 0 1 12 7.7c1.2 0 2.4.2 3.5.5M8.5 15.8c1.1.3 2.3.5 3.5.5s2.4-.2 3.5-.5"/><path d="M9.2 6 8 4.5a13 13 0 0 0-4 1.8C2.7 9 2.2 12 2.5 15a14 14 0 0 0 4.3 2.2L7.9 15.5M14.8 6 16 4.5a13 13 0 0 1 4 1.8c1.3 2.7 1.8 5.7 1.5 8.7a14 14 0 0 1-4.3 2.2l-1.1-1.7"/><path d="M9.5 12.5h.01M14.5 12.5h.01"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z"/>',
  window:
    '<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="M2.5 8.5h19M6 6.3h.01M8.5 6.3h.01"/>',
  server:
    '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01M11 7.5h4M11 16.5h4"/>',
  database:
    '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  layers:
    '<path d="m12 3 9 4.8-9 4.7-9-4.7L12 3Z"/><path d="m3 12.5 9 4.7 9-4.7M3 17l9 4.7 9-4.7"/>',
  shield:
    '<path d="M12 3.2 20 6v6c0 4.3-3.2 7.6-8 8.9-4.8-1.3-8-4.6-8-8.9V6l8-2.8Z"/><path d="m9 12 2 2 4-4"/>',
  wrench:
    '<path d="M20 5.5a5 5 0 0 1-6.6 6.4L6 19.3a2.1 2.1 0 0 1-3-3l7.4-7.4A5 5 0 0 1 16.9 2.3l-3 3 1.4 3.4 3.4 1.4 1.3-4.6Z"/>',
  message:
    '<path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.4A8.5 8.5 0 1 1 21 12Z"/><path d="M9 11h.01M12 11h.01M15 11h.01"/>',
  sparkle:
    '<path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9 12 3.5Z"/><path d="M18.5 3.5v3M20 5h-3"/>',
  compass:
    '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5.2-5.2 2 2-5.2 5.2-2Z"/>',
  route:
    '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h5.5"/>',
  code:
    '<path d="m8.5 8-4.5 4 4.5 4M15.5 8l4.5 4-4.5 4M13.5 5l-3 14"/>',
  check:
    '<path d="m4.5 12.5 5 5 10-11"/>',
  rocket:
    '<path d="M12 3c3.4 2 5.5 5.6 5.5 9.5v3.2l-2.8 2.1h-5.4L6.5 15.7v-3.2C6.5 8.6 8.6 5 12 3Z"/><path d="M9.3 18.5c-.6 1.3-.5 2.5-.5 2.5s1.2 0 2.4-.6M14.7 18.5c.6 1.3.5 2.5.5 2.5s-1.2 0-2.4-.6"/><circle cx="12" cy="10.5" r="1.8"/>',
  mail:
    '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  copy:
    '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15"/>',
  github:
    '<path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.8c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1-4.3-4.6 0-1 .4-1.9 1-2.5-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.6 1a9 9 0 0 1 4.7 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z"/>',
  arrowRight:
    '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
  arrowLeft:
    '<path d="M19.5 12h-15M10.5 6l-6 6 6 6"/>',
  arrowUpRight:
    '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  sun:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
  moon:
    '<path d="M20 14.2A8.5 8.5 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2Z"/>',
  external:
    '<path d="M14 4h6v6M20 4l-8.5 8.5"/><path d="M18 14v4.5A2.5 2.5 0 0 1 15.5 21h-9A2.5 2.5 0 0 1 4 18.5v-9A2.5 2.5 0 0 1 6.5 7H11"/>',
  star:
    '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8L12 3.6Z"/>',
};

/**
 * Renvoie le markup SVG d'une icône.
 * @param {string} name  clé du jeu d'icônes
 * @param {object} [options]
 * @param {boolean} [options.filled]  true pour un tracé plein (étoiles, logos)
 */
export function icon(name, options = {}) {
  const path = paths[name];
  if (!path) return '';
  const fill = options.filled ? 'currentColor' : 'none';
  const stroke = options.filled ? 'none' : 'currentColor';
  return `<svg viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}

export const iconNames = Object.keys(paths);
