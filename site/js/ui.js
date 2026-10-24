/** Petits composants d'interface partagés par le système et les applications. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';

export const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <rect x="2" y="2" width="60" height="60" rx="14" style="fill: var(--accent, #ff5a1f)"/>
  <path d="M22 21h22l-11 24" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** Crée un élément à partir d'une chaîne HTML (déjà échappée). */
export function el(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

export function tile(iconName, tone = 'ember', size = '') {
  return `<span class="tile tone-${e(tone)}${size ? ' tile--' + size : ''}">${icon(iconName)}</span>`;
}

export function stars(rating, max = 5) {
  if (!rating) return '';
  let out = '';
  for (let i = 1; i <= max; i++) out += icon('star', i <= rating ? '' : 'is-off');
  return `<span class="stars" role="img" aria-label="${rating} sur ${max}">${out}</span>`;
}

export function initials(name) {
  return String(name || '?')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

/** Couverture d'un projet : image fournie, sinon composition générée. */
export function cover(project, { label = true } = {}) {
  const image = project.cover ? `<img src="${e(project.cover)}" alt="" loading="lazy">` : '';
  return `<div class="cover tone-${e(project.tone)}">
    ${image || `<span class="cover__glyph">${icon(project.icon)}</span>`}
    ${label && !image ? `<span class="cover__name">${e(project.status || '')}</span>` : ''}
  </div>`;
}

/* ------------------------------ Notifications ------------------------------ */

let toastLayer;

export function mountToasts(root) {
  toastLayer = el('<div class="toasts" role="status" aria-live="polite"></div>');
  root.append(toastLayer);
}

export function toast({ title, text = '', iconName = 'info', tone = 'accent', duration = 4200 }) {
  if (!toastLayer) return;
  const node = el(`<div class="toast">
    ${tile(iconName, tone, 'sm')}
    <div><strong>${e(title)}</strong>${text ? `<p>${e(text)}</p>` : ''}</div>
  </div>`);
  toastLayer.append(node);
  const leave = () => {
    node.classList.add('is-leaving');
    node.addEventListener('animationend', () => node.remove(), { once: true });
    setTimeout(() => node.remove(), 400);
  };
  setTimeout(leave, duration);
  node.addEventListener('click', leave);
}

export async function copy(text, label = 'Copié') {
  try {
    await navigator.clipboard.writeText(text);
    toast({ title: label, text, iconName: 'copy' });
  } catch {
    toast({ title: 'Copie impossible', text, iconName: 'alert', tone: 'slate' });
  }
}
