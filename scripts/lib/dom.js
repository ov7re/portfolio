/**
 * Petits utilitaires DOM partagés par tous les composants.
 * Volontairement minimal : pas de librairie, pas de moteur de template.
 */

/** Sélecteur unique. */
export const qs = (selector, scope = document) => scope.querySelector(selector);

/** Sélecteur multiple, renvoyé sous forme de tableau. */
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Échappe les caractères qui casseraient le HTML (ou permettraient une injection). */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Typographie française : espace insécable avant les ponctuations doubles,
 * pour qu'un « : » ou un « ? » ne se retrouve jamais seul en début de ligne.
 */
export function frenchSpacing(value) {
  return String(value)
    .replace(/(\S) ([:;!?»])/g, '$1 $2')
    .replace(/(«) /g, '$1 ');
}

/**
 * Marque une chaîne comme étant déjà du HTML sûr (icônes, fragments générés),
 * afin qu'elle ne soit pas échappée par le template `html`.
 */
class RawHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}
export const raw = (value) => new RawHtml(value);

/**
 * Template littéral qui échappe automatiquement chaque valeur interpolée.
 *
 *   html`<p>${texteUtilisateur}</p>`          -> échappé
 *   html`<span>${raw(icon('mail'))}</span>`   -> inséré tel quel
 */
export function html(strings, ...values) {
  return strings.reduce((output, chunk, index) => {
    if (index === 0) return chunk;
    const value = values[index - 1];
    let rendered;
    if (value instanceof RawHtml) rendered = value.value;
    else if (Array.isArray(value))
      rendered = value
        .map((item) => (item instanceof RawHtml ? item.value : frenchSpacing(escapeHtml(item))))
        .join('');
    else if (value === null || value === undefined || value === false) rendered = '';
    else rendered = frenchSpacing(escapeHtml(value));
    return output + rendered + chunk;
  }, '');
}

/** Remplace le contenu d'un conteneur. Sans conteneur, ne fait rien. */
export function render(target, markup) {
  const node = typeof target === 'string' ? qs(target) : target;
  if (!node) return null;
  node.innerHTML = markup;
  return node;
}

/** Vrai si l'utilisateur a demandé à réduire les animations. */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lecture/écriture localStorage tolérante (mode privé, stockage bloqué). */
export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* stockage indisponible : on continue sans mémoriser */
    }
  },
};
