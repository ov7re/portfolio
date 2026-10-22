/**
 * Préférences du visiteur (thème, accent, fond d'écran, animations),
 * conservées dans son navigateur. Les valeurs par défaut viennent du contenu
 * (section « Système OV7 OS » du logiciel).
 */

const KEY = 'ov7.prefs';

let prefs = {};
let defaults = {};
const listeners = new Set();

try {
  prefs = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
} catch {
  prefs = {};
}

export function setDefaults(os) {
  defaults = { theme: os.theme, accent: os.accent, wallpaper: os.wallpaper, reduceMotion: false };
  apply();
}

export function getPref(key) {
  return prefs[key] ?? defaults[key];
}

export function isCustom(key) {
  return prefs[key] !== undefined;
}

export function setPref(key, value) {
  if (value === undefined || value === defaults[key]) delete prefs[key];
  else prefs[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* stockage indisponible (navigation privée) : la préférence vaut pour la session */
  }
  apply();
}

export function resetPrefs() {
  prefs = {};
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* rien à faire */
  }
  apply();
}

export function onPrefsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function apply() {
  const root = document.documentElement;
  root.dataset.theme = getPref('theme') || 'dark';
  root.style.setProperty('--accent', getPref('accent') || '#ff5a1f');
  root.classList.toggle('reduce-motion', Boolean(getPref('reduceMotion')));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', root.dataset.theme === 'light' ? '#e7e8ec' : '#0b0d10');
  for (const fn of listeners) fn();
}

export const reducedMotion = () =>
  Boolean(getPref('reduceMotion')) || matchMedia('(prefers-reduced-motion: reduce)').matches;
