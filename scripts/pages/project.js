/**
 * Page de détail d'un projet : projet.html?id=<identifiant>.
 * Tout le contenu vient de scripts/data/projects.js ; les blocs vides
 * (captures, liens, note) ne sont tout simplement pas rendus.
 */

import { qs, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { initI18n, t } from '../i18n/index.js';
import { observeReveals } from '../lib/reveal.js';
import * as motion from '../lib/motion.js';
import { mountHeader } from '../components/header.js';
import { mountFooter } from '../components/footer.js';
import { mountEasterEgg } from '../components/easter-egg.js';
import { getProjectById, getProjectNeighbours } from '../data/projects.js';
import { projectCover } from '../lib/cover.js';
import { site } from '../data/site.js';

/* ------------------------------------------------------------------ */
/* Blocs                                                              */
/* ------------------------------------------------------------------ */

function block(title, content) {
  if (!content) return '';
  return html`
    <section class="project-block" data-anim="fade">
      <h2 class="project-block__title">${title}</h2>
      ${raw(content)}
    </section>
  `;
}

function paragraph(text) {
  return text ? html`<p>${text}</p>` : '';
}

function featureList(features) {
  if (!features?.length) return '';
  return html`<ul class="feature-list">
    ${raw(features.map((feature) => html`<li>${feature}</li>`).join(''))}
  </ul>`;
}

function architectureList(steps) {
  if (!steps?.length) return '';
  return html`<ol class="arch-list">
    ${raw(steps.map((step) => html`<li><span><b>${step.title}</b> — ${step.text}</span></li>`).join(''))}
  </ol>`;
}

function screenshots(shots) {
  if (!shots?.length) return '';
  return html`<div class="shots-grid">
    ${raw(
      shots
        .map(
          (shot) => html`
            <figure class="shot">
              <img src="${shot.src}" alt="${shot.alt}" loading="lazy" decoding="async" />
              ${raw(shot.caption ? html`<figcaption>${shot.caption}</figcaption>` : '')}
            </figure>
          `
        )
        .join('')
    )}
  </div>`;
}

function tags(list) {
  return html`<div class="tag-list">
    ${raw(list.map((item) => html`<span class="tag">${item}</span>`).join(''))}
  </div>`;
}

function links(list) {
  if (!list?.length) return '';
  return list
    .map(
      (link) => html`
        <a class="btn btn--subtle" href="${link.href}" target="_blank" rel="noopener noreferrer">
          ${link.label}
        </a>
      `
    )
    .join('');
}

function aside(project) {
  return html`
    <div class="spec-card">
      <div class="spec-card__head"><span>${t('project.sheet', 'Fiche projet')}</span></div>
      <div class="spec-row">
        <span class="spec-row__k">${t('project.category', 'Catégorie')}</span>
        <span class="spec-row__v">${project.primaryLabel}</span>
      </div>
      <div class="spec-row">
        <span class="spec-row__k">${t('project.status', 'Statut')}</span>
        <span class="spec-row__v">${project.status}</span>
      </div>
      <div class="spec-row">
        <span class="spec-row__k">${t('project.stack', 'Stack')}</span>
        <span class="spec-row__v">${project.tech.join(' · ')}</span>
      </div>
    </div>

    <div class="project-cta">
      <h3>${t('project.ctaTitle', 'Un projet similaire ?')}</h3>
      <p>${t('project.ctaText', 'Décrivez votre besoin et recevez une réponse adaptée.')}</p>
      <a class="btn btn--primary btn--block" href="index.html#contact">
        ${t('common.quote', 'Demander un devis')}
      </a>
    </div>
  `;
}

function navigation(project) {
  const { previous, next } = getProjectNeighbours(project.id);
  if (!previous || !next) return '';

  return html`
    <nav class="project-nav" aria-label="Navigation entre les projets">
      <a class="project-nav__item" href="projet.html?id=${previous.id}">
        <span class="project-nav__dir">${t('project.previous', 'Projet précédent')}</span>
        <span class="project-nav__name">${previous.name}</span>
      </a>
      <a class="project-nav__item project-nav__item--next" href="projet.html?id=${next.id}">
        <span class="project-nav__dir">${t('project.next', 'Projet suivant')}</span>
        <span class="project-nav__name">${next.name}</span>
      </a>
    </nav>
  `;
}

/* ------------------------------------------------------------------ */
/* Rendu                                                              */
/* ------------------------------------------------------------------ */

function renderNotFound(root) {
  document.title = `${t('project.notFoundTitle', 'Projet introuvable')} · ${site.name}`;
  render(
    root,
    html`
      <div class="container">
        <div class="project-404">
          <h1>${t('project.notFoundTitle', 'Projet introuvable')}</h1>
          <p>
            ${t(
              'project.notFoundText',
              'Ce projet n’existe pas ou n’est plus présenté sur le site.'
            )}
          </p>
          <a class="btn btn--primary" href="index.html#projets">
            ${t('common.backToProjects', 'Retour aux projets')}
          </a>
        </div>
      </div>
    `
  );
}

function renderProject(root, project) {
  // Séparateur « · » : certains noms de projet contiennent déjà un tiret cadratin.
  document.title = `${project.name} · ${site.name}`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', project.summary);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `${site.url}/projet.html?id=${project.id}`);

  render(
    root,
    html`
      <div class="container">
        <a class="project-back" href="index.html#projets">
          ${raw(icon('arrowLeft'))} ${t('common.backToProjects', 'Retour aux projets')}
        </a>

        <header class="project-hero">
          <div class="project-hero__meta">
            <span class="tag tag--accent">${project.primaryLabel}</span>
            <span class="status-dot">${project.status}</span>
          </div>
          <h1 class="project-hero__title">${project.name}</h1>
          <p class="project-hero__lead">${project.summary}</p>
          ${raw(
            project.links.length
              ? html`<div class="project-hero__actions">${raw(links(project.links))}</div>`
              : ''
          )}
        </header>

        <div class="project-cover" data-anim="card">${raw(projectCover(project.motif))}</div>

        <div class="project-layout">
          <div class="project-content">
            ${raw(block(t('project.overview', 'Présentation'), paragraph(project.presentation)))}
            ${raw(block(t('project.problem', 'Problématique'), paragraph(project.problem)))}
            ${raw(block(t('project.solution', 'Solution'), paragraph(project.solution)))}
            ${raw(block(t('project.features', 'Fonctionnalités'), featureList(project.features)))}
            ${raw(
              block(t('project.architecture', 'Architecture'), architectureList(project.architecture))
            )}
            ${raw(block(t('project.tech', 'Technologies'), tags(project.tech)))}
            ${raw(block(t('project.screenshots', 'Captures'), screenshots(project.screenshots)))}
            ${raw(
              block(
                t('project.result', 'Résultat'),
                project.result
                  ? html`<div class="project-result">
                      <p>${project.result}</p>
                    </div>`
                  : ''
              )
            )}
            ${raw(
              project.note
                ? html`<p class="contact__note" data-anim="fade">${project.note}</p>`
                : ''
            )}
          </div>

          <aside class="project-aside">${raw(aside(project))}</aside>
        </div>

        ${raw(navigation(project))}
      </div>
    `
  );

  root.querySelectorAll('.project-back svg').forEach((svg) => {
    svg.setAttribute('width', '15');
    svg.setAttribute('height', '15');
  });
}

/** Charge la scène 3D. Toute erreur est absorbée : elle reste décorative. */
async function startScene(project) {
  const canvas = qs('[data-scene]');
  if (!canvas) return null;

  try {
    const { createScene } = await import('../lib/scene3d.js');
    const scene = createScene(canvas);
    if (!scene) {
      canvas.remove();
      return null;
    }
    scene.show(1);
    // La page projet montre la trame « architecture » : la même matière que
    // la section projets de l'accueil, pour garder le fil visuel.
    scene.morphTo(scene.indexOf(project ? 'projets' : 'accueil'));
    return scene;
  } catch (error) {
    console.warn('[OV7] Scène 3D indisponible, la page continue sans :', error);
    canvas.remove();
    return null;
  }
}

async function start() {
  await initI18n();

  const root = qs('[data-project-root]');
  const id = new URLSearchParams(window.location.search).get('id');
  const project = id ? getProjectById(id) : null;

  if (project) renderProject(root, project);
  else renderNotFound(root);

  mountHeader();
  mountFooter();
  mountEasterEgg();

  const scene = await startScene(project);

  if (motion.initMotion()) {
    document.documentElement.classList.add('motion');
    document.documentElement.dataset.motion = 'ready';
    motion.initHeaderMotion();
    motion.projectIntro();
    motion.revealOnScroll();
    motion.magneticButtons();
    motion.bindScene(scene);
  } else {
    document.documentElement.classList.remove('motion');
    observeReveals();
  }

  motion.pageTransitions();

  const toggle = qs('[data-theme-toggle]');
  if (toggle && scene) {
    toggle.addEventListener('click', () => {
      scene.setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    });
  }
}

start().catch((error) => {
  document.documentElement.classList.remove('motion');
  observeReveals();
  console.error('[OV7] Initialisation interrompue :', error);
});
