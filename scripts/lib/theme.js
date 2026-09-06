/**
 * Thème clair / sombre.
 * Le mode sombre est le mode principal : il s'applique par défaut, y compris
 * si l'utilisateur n'a jamais fait de choix.
 */

import { qsa, storage } from './dom.js';

const STORAGE_KEY = 'ov7-theme';
const DARK = 'dark';
const LIGHT = 'light';

/** Thème actuellement appliqué. */
export function getTheme() {
  return document.documentElement.dataset.theme === LIGHT ? LIGHT : DARK;
}

function apply(theme) {
  document.documentElement.dataset.theme = theme;
  qsa('[data-theme-toggle]').forEach((button) => {
    const toLight = theme === DARK;
    button.setAttribute('aria-pressed', String(theme === LIGHT));
    button.setAttribute('aria-label', toLight ? 'Activer le thème clair' : 'Activer le thème sombre');
    button.setAttribute('title', toLight ? 'Thème clair' : 'Thème sombre');
  });
}

/**
 * Applique le thème mémorisé le plus tôt possible.
 * Appelé aussi depuis un script inline dans le <head> pour éviter tout flash.
 */
export function initTheme() {
  apply(storage.get(STORAGE_KEY) === LIGHT ? LIGHT : DARK);
}

/** Bascule le thème et mémorise le choix. */
export function toggleTheme() {
  const next = getTheme() === DARK ? LIGHT : DARK;
  apply(next);
  storage.set(STORAGE_KEY, next);
  return next;
}

/** Branche tous les boutons `[data-theme-toggle]` de la page. */
export function bindThemeToggles(scope = document) {
  qsa('[data-theme-toggle]', scope).forEach((button) => {
    button.addEventListener('click', toggleTheme);
  });
  apply(getTheme());
}
