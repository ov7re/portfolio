/**
 * Point d'entrée de la page d'accueil.
 *
 * Ordre volontaire :
 *   1. internationalisation
 *   2. montage du contenu (le site doit être complet même sans animation)
 *   3. scène 3D, chargée à part pour qu'un échec ne casse jamais la page
 *   4. couche de motion design, ou repli maison si GSAP n'a pas démarré
 */

import { qs } from '../lib/dom.js';
import { initI18n } from '../i18n/index.js';
import { observeReveals } from '../lib/reveal.js';
import * as motion from '../lib/motion.js';

import { mountHeader } from '../components/header.js';
import { mountStats } from '../components/stats.js';
import { mountServices } from '../components/services.js';
import { mountProcess } from '../components/process.js';
import { mountProjects } from '../components/projects.js';
import { mountTechnologies } from '../components/technologies.js';
import { mountAbout } from '../components/about.js';
import { mountAdvantages } from '../components/advantages.js';
import { mountReviews } from '../components/reviews.js';
import { mountContact } from '../components/contact.js';
import { mountFooter } from '../components/footer.js';
import { mountEasterEgg } from '../components/easter-egg.js';

/** Charge la scène 3D. Toute erreur est absorbée : elle reste décorative. */
async function startScene() {
  const canvas = qs('[data-scene]');
  if (!canvas) return null;

  try {
    const { createScene } = await import('../lib/scene3d.js');
    const scene = createScene(canvas);
    if (!scene) {
      canvas.remove();
      return null;
    }
    // La scène se dévoile d'elle-même : elle ne dépend d'aucune timeline.
    scene.show(1);
    return scene;
  } catch (error) {
    console.warn('[OV7] Scène 3D indisponible, la page continue sans :', error);
    canvas.remove();
    return null;
  }
}

function mountContent() {
  mountHeader();
  mountStats();
  mountServices();
  mountProcess();
  mountProjects();
  mountTechnologies();
  mountAbout();
  mountAdvantages();
  mountReviews();
  mountContact();
  mountFooter();
  mountEasterEgg();
}

/** Anime la page. Renvoie false si la couche mouvement n'a pas pu démarrer. */
function startMotion(scene) {
  if (!motion.initMotion()) return false;

  // Confirme au filet de sécurité posé dans le <head> que tout va bien.
  // La classe est remise au cas où le filet aurait déjà agi (démarrage lent) :
  // les états de départ redeviennent valides puisque GSAP va bien les animer.
  document.documentElement.classList.add('motion');
  document.documentElement.dataset.motion = 'ready';

  // Créés dans l'ordre de la page : ScrollTrigger recalcule dans cet ordre.
  motion.initHeaderMotion();
  motion.heroIntro();
  motion.countUpStats();
  motion.revealOnScroll();
  motion.magneticButtons();
  motion.bindScene(scene);

  return true;
}

async function start() {
  await initI18n();
  mountContent();

  const scene = await startScene();

  if (!startMotion(scene)) {
    // Repli : apparitions maison, scène affichée telle quelle.
    document.documentElement.classList.remove('motion');
    observeReveals();
    scene?.show(1);
  }

  // Accès de réglage : http://…/index.html?debug puis __ov7.scene.setProgress(0.4, true)
  if (new URLSearchParams(window.location.search).has('debug')) {
    window.__ov7 = { scene, motion };
  }

  motion.pageTransitions();

  // Le thème change les couleurs de la scène en même temps que la page.
  const toggle = qs('[data-theme-toggle]');
  if (toggle && scene) {
    toggle.addEventListener('click', () => {
      scene.setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    });
  }

  // Le filtrage des projets change la hauteur de la page.
  qs('[data-project-filters]')?.addEventListener('click', () => {
    window.setTimeout(motion.refreshMotion, 420);
  });
}

start().catch((error) => {
  // Quoi qu'il arrive, la page doit rester lisible : on retire la couche
  // mouvement et on repasse par les apparitions maison.
  document.documentElement.classList.remove('motion');
  observeReveals();
  console.error('[OV7] Initialisation interrompue :', error);
});
