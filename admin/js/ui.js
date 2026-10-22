/** Composants d'interface du logiciel : notifications, boîtes de dialogue. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';

export const LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="ov7-studio" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff5a1f"/><stop offset=".6" stop-color="#d4162c"/><stop offset="1" stop-color="#8f0f1e"/>
  </linearGradient></defs>
  <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ov7-studio)"/>
  <path d="M22 21h22l-11 24" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function el(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

let toastLayer;

export function toast(title, text = '', { error = false } = {}) {
  if (!toastLayer) {
    toastLayer = el('<div class="toasts" role="status" aria-live="polite"></div>');
    document.body.append(toastLayer);
  }
  const node = el(`<div class="toast${error ? ' toast--error' : ''}">
    ${icon(error ? 'alert' : 'check')}<div><strong>${e(title)}</strong>${text ? `<p>${e(text)}</p>` : ''}</div>
  </div>`);
  toastLayer.append(node);
  setTimeout(() => node.remove(), error ? 7000 : 3800);
  node.addEventListener('click', () => node.remove());
}

export const toastError = (error) => toast('Erreur', error.message || String(error), { error: true });

/** Fenêtre modale générique ; `content` est un élément ou du HTML. */
export function modal(content, { wide = false } = {}) {
  const back = el(`<div class="modal-back"><div class="modal${wide ? ' modal--wide' : ''}" role="dialog" aria-modal="true"></div></div>`);
  const box = back.firstElementChild;
  if (typeof content === 'string') box.innerHTML = content;
  else box.append(content);
  const previous = document.activeElement;
  const close = () => {
    back.remove();
    document.removeEventListener('keydown', onKey);
    previous?.focus?.();
  };
  const onKey = (event) => event.key === 'Escape' && close();
  back.addEventListener('pointerdown', (event) => event.target === back && close());
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  setTimeout(() => box.querySelector('input, textarea, button.btn--primary, button')?.focus(), 20);
  return { box, close };
}

export function confirmDialog({ title, text = '', confirm = 'Confirmer', danger = false }) {
  return new Promise((resolve) => {
    const { box, close } = modal(`
      <h2>${e(title)}</h2>
      ${text ? `<p>${e(text)}</p>` : ''}
      <div class="modal__actions">
        <button class="btn" type="button" data-no>Annuler</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-yes>${e(confirm)}</button>
      </div>`);
    let answered = false;
    const answer = (value) => {
      answered = true;
      close();
      resolve(value);
    };
    box.querySelector('[data-no]').addEventListener('click', () => answer(false));
    box.querySelector('[data-yes]').addEventListener('click', () => answer(true));
    const observer = new MutationObserver(() => {
      if (!box.isConnected && !answered) {
        observer.disconnect();
        resolve(false);
      }
    });
    observer.observe(document.body, { childList: true });
  });
}

/** Désactive un bouton pendant une action asynchrone. */
export async function busy(button, task) {
  button?.classList.add('is-busy');
  try {
    return await task();
  } finally {
    button?.classList.remove('is-busy');
  }
}

export function timeAgo(value) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return 'à l’instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/** Lit un fichier image en data URL pour l'envoyer à l'API. */
export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
