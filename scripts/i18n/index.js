/**
 * Internationalisation.
 *
 * Principe retenu : le français est la langue par défaut et vit directement
 * dans le HTML (bon pour le référencement, et le texte reste lisible si le
 * JavaScript ne s'exécute pas). Les chaînes produites par le JavaScript, qui
 * n'ont pas d'équivalent dans le HTML, vivent dans les dictionnaires.
 *
 * Ajouter l'anglais plus tard :
 *   1. créer scripts/i18n/en.js sur le modèle de fr.js, en traduisant aussi
 *      les clés `data-i18n` présentes dans les fichiers HTML ;
 *   2. ajouter 'en' à SUPPORTED et son chargeur dans `loaders` ;
 *   3. afficher le sélecteur de langue (déjà prévu : [data-lang-switch]).
 * Aucun autre fichier n'a besoin d'être modifié.
 */

import { qsa, storage } from '../lib/dom.js';

export const DEFAULT_LANG = 'fr';
export const SUPPORTED = ['fr'];

const STORAGE_KEY = 'ov7-lang';

const loaders = {
  fr: () => import('./fr.js'),
  // en: () => import('./en.js'),
};

let current = DEFAULT_LANG;
let dictionary = {};

/** Langue active. */
export const getLang = () => current;

/** Langue à utiliser : choix mémorisé, puis langue du navigateur, puis défaut. */
function detectLang() {
  const saved = storage.get(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved)) return saved;
  const navLang = (navigator.language || DEFAULT_LANG).slice(0, 2).toLowerCase();
  return SUPPORTED.includes(navLang) ? navLang : DEFAULT_LANG;
}

/**
 * Traduit une clé.
 * @param {string} key       clé pointée, ex. 'project.overview'
 * @param {string} [fallback] texte utilisé si la clé n'existe pas
 */
export function t(key, fallback = '') {
  const value = key.split('.').reduce((node, part) => (node ? node[part] : undefined), dictionary);
  return typeof value === 'string' ? value : fallback || key;
}

/**
 * Applique les traductions aux éléments porteurs d'une clé.
 *   data-i18n        -> contenu texte
 *   data-i18n-attr   -> "attribut:clé" séparés par des virgules
 * En français, le HTML fait déjà foi : rien n'est remplacé sans traduction.
 */
export function applyTranslations(scope = document) {
  qsa('[data-i18n]', scope).forEach((el) => {
    const value = t(el.dataset.i18n, '');
    if (value && value !== el.dataset.i18n) el.textContent = value;
  });

  qsa('[data-i18n-attr]', scope).forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((part) => part.trim());
      if (!attr || !key) return;
      const value = t(key, '');
      if (value && value !== key) el.setAttribute(attr, value);
    });
  });
}

/** Charge un dictionnaire et l'applique au document. */
export async function setLang(lang) {
  const target = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
  const loader = loaders[target];
  if (!loader) return;

  const module = await loader();
  dictionary = module.default || module.dictionary || {};
  current = target;
  document.documentElement.lang = target;
  storage.set(STORAGE_KEY, target);
  applyTranslations();
}

/** Initialise l'internationalisation avant le rendu des composants. */
export async function initI18n() {
  await setLang(detectLang());
}
