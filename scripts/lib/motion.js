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
/* Header : barre de progression et masquage au défilement            */
/* ------------------------------------------------------------------ */

export function initHeaderMotion() {
  if (!isAvailable()) return;
  register();

  const header = qs('[data-header]');
  const progress = qs('[data-scroll-progress]');

  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.25 },
    });
  }

  if (!header) return;

  // Le header s'efface en descendant, revient dès qu'on remonte :
  // la navigation reste à portée sans manger l'écran.
  ScrollTrigger.create({
    start: 'top -120',
    end: 'max',
    onUpdate(self) {
      const hide = self.direction === 1 && self.scroll() > 260;
      gsap.to(header, {
        yPercent: hide ? -110 : 0,
        duration: MOTION.base,
        ease: hide ? MOTION.easeIn : MOTION.ease,
        overwrite: true,
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Hero : la mise en scène d'ouverture                                */
/* ------------------------------------------------------------------ */

/**
 * Séquence d'entrée. Un seul héros — le titre — puis les éléments
 * secondaires, puis le fond. Budget total sous 1,6 s.
 */
export function heroIntro() {
  if (!isAvailable()) return null;
  register();

  // Uniquement des `.to()` : les états de départ viennent de motion.css.
  const timeline = gsap.timeline({ defaults: { ease: MOTION.ease } });

  timeline
    .to('[data-hero-label]', { y: 0, opacity: 1, duration: 0.6 }, 0.1)
    .to(
      '.hero__title .line__inner',
      { y: 0, duration: 1, stagger: 0.09, ease: 'power3.out' },
      0.18
    )
    .to('[data-hero-lead]', { y: 0, opacity: 1, duration: 0.7 }, 0.62)
    .to('[data-hero-actions] > *', { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 }, 0.76)
    .to('[data-hero-meta] span', { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 }, 0.9)
    .to('[data-hero-visual]', { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out' }, 0.42)
    .to('[data-hero-visual] .code-line', { opacity: 1, duration: 0.4, stagger: 0.035 }, 0.72);

  return timeline;
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
 *   fade   — translation courte + opacité (par défaut)
 *   mask   — le texte monte derrière un masque (titres)
 *   scale  — léger rapprochement (visuels)
 */
export function revealOnScroll(scope = document) {
  if (!isAvailable()) return;
  register();

  // Titres : montée derrière un masque
  qsa('[data-anim="mask"]', scope).forEach((el) => {
    gsap.from(el, {
      yPercent: 100,
      duration: MOTION.slow,
      ease: 'power3.out',
      scrollTrigger: { trigger: el.closest('[data-anim-trigger]') || el, start: 'top 88%' },
    });
  });

  // Blocs simples
  ScrollTrigger.batch('[data-anim="fade"]', {
    start: 'top 88%',
    once: true,
    interval: 0.08,
    batchMax: 6,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: MOTION.stagger,
        overwrite: true,
      }),
  });

  // Cartes : cascade courte, jamais plus de 500 ms au total
  ScrollTrigger.batch('[data-anim="card"]', {
    start: 'top 90%',
    once: true,
    interval: 0.06,
    batchMax: 6,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.65,
        stagger: 0.05,
        ease: 'power3.out',
        overwrite: true,
      }),
  });
}

/* ------------------------------------------------------------------ */
/* Compteurs                                                          */
/* ------------------------------------------------------------------ */

/** Les statistiques chiffrées comptent en entrant à l'écran. */
export function countUpStats() {
  if (!isAvailable()) return;
  register();

  qsa('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      duration: 1.2,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: () => {
        el.textContent = String(Math.round(counter.value));
      },
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
}

/* ------------------------------------------------------------------ */
/* Méthode : progression horizontale pilotée par le défilement        */
/* ------------------------------------------------------------------ */

/**
 * Sur grand écran, la section méthode se fige et les six étapes défilent
 * horizontalement. Sur mobile, elles restent empilées : pas de pin, pas de
 * défilement détourné sur un écran étroit.
 */
export function processTrack() {
  if (!isAvailable()) return;
  register();

  const section = qs('[data-process-section]');
  const track = qs('[data-process-track]');
  if (!section || !track) return;

  gsap.matchMedia().add('(min-width: 901px)', () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 120);

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance() + window.innerHeight * 0.6}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    // Chaque étape s'éclaire quand elle passe au centre
    qsa('[data-step]', track).forEach((step) => {
      gsap.to(step, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        scrollTrigger: {
          trigger: step,
          containerAnimation: tween,
          start: 'left 78%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    return () => {
      gsap.set(track, { x: 0 });
    };
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

/** Inclinaison des cartes projet au survol : de la profondeur, pas un jouet. */
export function tiltCards(scope = document) {
  if (!isAvailable() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  register();

  qsa('[data-tilt]', scope).forEach((card) => {
    const media = qs('.project-card__media', card);
    const rotateX = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: MOTION.ease });
    const rotateY = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: MOTION.ease });
    const shiftY = media ? gsap.quickTo(media, 'yPercent', { duration: 0.6, ease: MOTION.ease }) : null;

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotateX(-py * 5);
      rotateY(px * 6);
      if (shiftY) shiftY(-py * 3);
    });

    card.addEventListener('pointerleave', () => {
      rotateX(0);
      rotateY(0);
      if (shiftY) shiftY(0);
    });
  });
}

/** Léger parallaxe : le fond avance moins vite que le contenu. */
export function parallax(scope = document) {
  if (!isAvailable()) return;
  register();

  qsa('[data-parallax]', scope).forEach((el) => {
    const amount = Number(el.dataset.parallax) || 60;
    gsap.fromTo(
      el,
      { y: -amount / 2 },
      {
        y: amount / 2,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });
}

/* ------------------------------------------------------------------ */
/* Liaison avec la scène 3D                                           */
/* ------------------------------------------------------------------ */

/**
 * Fait correspondre chaque section à une forme du nuage de points, et
 * transmet la vitesse de défilement à la scène : plus on va vite, plus la
 * matière s'agite.
 */
export function bindScene(scene) {
  if (!scene) return;

  if (!isAvailable()) {
    scene.show(1);
    return;
  }
  register();

  qsa('[data-shape]').forEach((section) => {
    const index = scene.indexOf(section.dataset.shape);
    if (index < 0) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => scene.morphTo(index),
      onEnterBack: () => scene.morphTo(index),
    });
  });

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      scene.setEnergy(Math.min(Math.abs(self.getVelocity()) / 2600, 1));
      scene.setSpin(self.progress * Math.PI * 1.4);
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
