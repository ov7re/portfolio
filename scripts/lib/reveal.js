/**
 * Apparition au défilement — voie de secours.
 *
 * Utilisée uniquement quand GSAP n'a pas pu démarrer (CDN bloqué) ou quand
 * l'utilisateur a demandé à réduire les animations. Elle observe les mêmes
 * éléments `[data-anim]` que la couche de motion design, pour qu'il n'existe
 * qu'un seul balisage dans tout le site.
 */

import { qsa, prefersReducedMotion } from './dom.js';

const SELECTOR = '[data-anim]:not(.is-visible)';

let observer = null;

function ensureObserver() {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  return observer;
}

/**
 * Filet de sécurité : si l'observateur n'a pas encore réagi (onglet ouvert en
 * arrière-plan, rendu suspendu…), tout ce qui est déjà dans la fenêtre est
 * affiché. Mieux vaut une apparition sans animation qu'un contenu invisible.
 */
function safetyNet(scope) {
  const reveal = () => {
    qsa(SELECTOR, scope).forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-visible');
    });
  };
  window.setTimeout(reveal, 1200);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.setTimeout(reveal, 200);
  });
}

/**
 * Observe les éléments animés présents dans `scope`.
 * Les enfants d'un conteneur `[data-stagger]` reçoivent un délai croissant.
 */
export function observeReveals(scope = document) {
  const targets = qsa(SELECTOR, scope);

  // Mouvement réduit ou navigateur sans IntersectionObserver : tout est
  // affiché immédiatement, jamais laissé invisible.
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Signale à la feuille de style que cette voie prend le relais : c'est
  // elle, et elle seule, qui autorise l'état masqué.
  document.documentElement.classList.add('reveal-js');

  const io = ensureObserver();
  targets.forEach((el) => {
    const parent = el.closest('[data-stagger]');
    if (parent && !el.style.getPropertyValue('--reveal-delay')) {
      const siblings = qsa('[data-anim]', parent);
      const index = siblings.indexOf(el);
      const step = Number(parent.dataset.stagger) || 70;
      el.style.setProperty('--reveal-delay', `${Math.min(index, 8) * step}ms`);
    }
    io.observe(el);
  });

  safetyNet(scope);
}
