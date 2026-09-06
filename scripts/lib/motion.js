/**
 * Couche de motion design (GSAP + ScrollTrigger).
 *
 * Personnalité de mouvement : « Premium ».
 *   durées   0.18s (retour immédiat) · 0.45s (standard) · 0.9s (révélation)
 *   easing   power2.out en entrée, power2.in en sortie, power2.inOut sur place
 *   amplitude faible, aucun rebond : le site doit rester sérieux.
 *
 * Trois couches sont toujours présentes : l'élément principal, un détail
 * secondaire qui le suit, et un fond qui vit en permanence (la scène 3D).
 *
 * GSAP est chargé par balise <script> classique : si le CDN est bloqué,
 * `isAvailable()` renvoie false et le site retombe sur ses apparitions
 * maison. Rien n'est jamais laissé invisible.
 */

import { qs, qsa, prefersReducedMotion } from './dom.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

/** Constantes de la personnalité de mouvement. */
export const MOTION = {
  quick: 0.18,
  base: 0.45,
  slow: 0.9,
  ease: 'power2.out',
  easeIn: 'power2.in',
  easeInOut: 'power2.inOut',
  stagger: 0.06,
};

export const isAvailable = () => Boolean(gsap && ScrollTrigger);

let registered = false;
function register() {
  if (registered || !isAvailable()) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: MOTION.ease, duration: MOTION.base });
  registered = true;
}

/* ------------------------------------------------------------------ */
/* Header : barre de progression et passage en mode compact           */
/* ------------------------------------------------------------------ */

export function initHeaderMotion() {
  if (!isAvailable()) return;
  register();

  // Révélation du header. Elle vit ici et non dans heroIntro() : les pages
  // projet n'ont pas de hero, et le header y resterait invisible.
  gsap.to('.header .wordmark-link', { opacity: 1, duration: 0.8, delay: 0.1 });
  gsap.to('.header__right', { opacity: 1, duration: 0.8, delay: 0.3 });

  const progress = qs('[data-scroll-progress]');
  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.25 },
    });
  }

  const header = qs('[data-header]');
  if (!header) return;

  // Le header reste visible en permanence — c'est le seul repère de
  // navigation — mais il se compacte dès qu'on quitte le premier écran.
  ScrollTrigger.create({
    start: 'top -70',
    end: 'max',
    onToggle: (self) => header.classList.toggle('is-stuck', self.isActive),
  });
}

/* ------------------------------------------------------------------ */
/* Hero : la mise en scène d'ouverture                                */
/* ------------------------------------------------------------------ */

/**
 * Séquence d'entrée. Le repère de marque, puis la phrase, puis les données.
 * Budget total sous 1,8 s — la scène 3D, elle, est déjà là.
 */
export function heroIntro() {
  if (!isAvailable()) return null;
  register();

  // Uniquement des `.to()` : les états de départ viennent de motion.css.
  return gsap
    .timeline({ defaults: { ease: MOTION.ease } })
    .to(
      '.hero__statement .line__inner',
      { y: 0, duration: 1.15, stagger: 0.1, ease: 'power3.out' },
      0.35
    )
    .to('[data-hero-hud]', { opacity: 1, y: 0, duration: 0.8 }, 0.85);
}

/**
 * Ouverture d'une page projet : plus sobre que le hero d'accueil, mais
 * même grammaire — l'élément principal d'abord, le reste dans sa foulée.
 */
export function projectIntro() {
  if (!isAvailable()) return null;
  register();

  return gsap
    .timeline({ defaults: { ease: MOTION.ease } })
    .from('.project-back', { opacity: 0, x: -12, duration: 0.5 }, 0.05)
    .from('.project-hero__meta > *', { opacity: 0, y: 12, duration: 0.5, stagger: 0.07 }, 0.12)
    .from('.project-hero__title', { opacity: 0, y: 28, duration: 0.8, ease: 'power3.out' }, 0.2)
    .from('.project-hero__lead', { opacity: 0, y: 20, duration: 0.7 }, 0.34)
    .from('.project-hero__actions', { opacity: 0, y: 16, duration: 0.6 }, 0.44);
}

/* ------------------------------------------------------------------ */
/* Révélations au défilement                                          */
/* ------------------------------------------------------------------ */

/**
 * Apparition des blocs. `data-anim` choisit le registre :
 *   fade  — translation courte + opacité (titres, lignes, paragraphes)
 *   card  — panneaux denses (formulaire, fiches)
 */
export function revealOnScroll() {
  if (!isAvailable()) return;
  register();

  ScrollTrigger.batch('[data-anim="fade"]', {
    start: 'top 90%',
    once: true,
    interval: 0.07,
    batchMax: 6,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: MOTION.stagger,
        overwrite: true,
      }),
  });

  ScrollTrigger.batch('[data-anim="card"]', {
    start: 'top 92%',
    once: true,
    interval: 0.06,
    batchMax: 4,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.06,
        ease: 'power3.out',
        overwrite: true,
      }),
  });
}

/* ------------------------------------------------------------------ */
/* Compteurs                                                          */
/* ------------------------------------------------------------------ */

/** Les valeurs chiffrées du relevé comptent à l'ouverture. */
export function countUpStats() {
  if (!isAvailable()) return;
  register();

  qsa('[data-count]').forEach((el, index) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const counter = { value: 0 };
    el.textContent = '0';

    gsap.to(counter, {
      value: target,
      duration: 1.4,
      delay: 1 + index * 0.08,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Micro-interactions                                                 */
/* ------------------------------------------------------------------ */

/** Boutons légèrement magnétiques — souris uniquement, amplitude minime. */
export function magneticButtons(scope = document) {
  if (!isAvailable() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  register();

  qsa('[data-magnetic]', scope).forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.28;
    const setX = gsap.quickTo(el, 'x', { duration: 0.4, ease: MOTION.ease });
    const setY = gsap.quickTo(el, 'y', { duration: 0.4, ease: MOTION.ease });

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      setX((event.clientX - rect.left - rect.width / 2) * strength);
      setY((event.clientY - rect.top - rect.height / 2) * strength);
    });

    el.addEventListener('pointerleave', () => {
      setX(0);
      setY(0);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Liaison avec la scène 3D                                           */
/* ------------------------------------------------------------------ */

/**
 * Une seule source de vérité : la progression de lecture de la page pilote
 * à la fois la caméra et l'assemblage de la structure.
 */
export function bindScene(scene) {
  if (!scene) return;
  scene.show(1);

  if (!isAvailable()) {
    scene.setProgress(0);
    return;
  }
  register();

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      scene.setProgress(self.progress);
      scene.setEnergy(Math.min(Math.abs(self.getVelocity()) / 2600, 1));
    },
  });
}

/* ------------------------------------------------------------------ */
/* Transition de page                                                 */
/* ------------------------------------------------------------------ */

/**
 * Voile de sortie entre l'accueil et une page projet.
 * Le voile est hors écran tant qu'on ne quitte pas la page : aucune animation
 * n'est nécessaire pour révéler le contenu, seulement pour le quitter.
 */
export function pageTransitions() {
  const curtain = qs('[data-curtain]');
  if (!curtain) return;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !isAvailable()) return;

    const url = new URL(link.href, window.location.href);
    const sameOrigin = url.origin === window.location.origin;
    const isDocument = /\.html($|\?)/.test(url.pathname) || url.pathname.endsWith('/');
    const newTab = link.target === '_blank' || event.metaKey || event.ctrlKey;

    if (!sameOrigin || !isDocument || newTab) return;
    if (url.pathname === window.location.pathname && url.search === window.location.search) return;

    event.preventDefault();

    // Sécurité : si l'animation ne se termine pas (onglet en arrière-plan,
    // rendu suspendu), on navigue quand même.
    const go = () => {
      window.location.href = url.href;
    };
    const failsafe = window.setTimeout(go, 900);

    gsap.fromTo(
      curtain,
      { yPercent: 100 },
      {
        yPercent: 0,
        duration: 0.55,
        ease: 'power3.inOut',
        onComplete: () => {
          window.clearTimeout(failsafe);
          go();
        },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* Point d'entrée                                                     */
/* ------------------------------------------------------------------ */

/**
 * Prépare la couche de motion. Renvoie false si GSAP n'est pas disponible
 * ou si l'utilisateur a demandé à réduire les animations — l'appelant
 * retombe alors sur les apparitions maison.
 */
export function initMotion() {
  if (!isAvailable() || prefersReducedMotion()) return false;
  register();
  ScrollTrigger.config({ ignoreMobileResize: true });
  return true;
}

/** Recalcule les positions après une modification du DOM (filtres, images). */
export function refreshMotion() {
  if (isAvailable()) ScrollTrigger.refresh();
}
