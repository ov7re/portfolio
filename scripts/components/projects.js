/**
 * Section projets : filtres animés et grille de cartes.
 * Les cartes et les filtres sont entièrement dérivés de scripts/data/projects.js.
 */

import { qs, qsa, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { projects, getUsedCategories } from '../data/projects.js';
import { projectCover } from '../lib/cover.js';
import { t } from '../i18n/index.js';
import { observeReveals } from '../lib/reveal.js';

const MAX_TAGS = 4;

function projectCard(project) {
  const visibleTags = project.tech.slice(0, MAX_TAGS);
  const extra = project.tech.length - visibleTags.length;

  return html`
    <article
      class="project-card"
      data-project-card
      data-anim="card"
      data-tilt
      data-categories="${project.categories.join(' ')}"
    >
      <div class="project-card__media">
        ${raw(projectCover(project.motif))}
        <span class="project-card__cat">${project.primaryLabel}</span>
      </div>
      <div class="project-card__body">
        <h3 class="project-card__title">
          <span>${project.name}</span>
          <span class="project-card__status">${project.status}</span>
        </h3>
        <p class="project-card__text">${project.summary}</p>
        <div class="project-card__foot">
          <div class="tag-list">
            ${raw(visibleTags.map((tech) => html`<span class="tag">${tech}</span>`).join(''))}
            ${raw(extra > 0 ? html`<span class="tag">+${extra}</span>` : '')}
          </div>
          <a class="link-arrow project-card__link" href="projet.html?id=${project.id}">
            <span class="visually-hidden">${project.name} — </span>${t('common.details', 'Détails')}
            ${raw(icon('arrowRight'))}
          </a>
        </div>
      </div>
    </article>
  `;
}

function filterButton(category, isActive) {
  return html`
    <button
      type="button"
      class="filter"
      data-filter="${category.id}"
      aria-pressed="${isActive ? 'true' : 'false'}"
    >
      ${category.label}<span class="filter__count">${category.count}</span>
    </button>
  `;
}

function applyFilter(grid, emptyState, value) {
  let visible = 0;

  qsa('[data-project-card]', grid).forEach((card) => {
    const matches = value === 'all' || card.dataset.categories.split(' ').includes(value);
    card.classList.toggle('is-hidden', !matches);
    if (matches) visible += 1;
  });

  if (emptyState) emptyState.hidden = visible > 0;
}

export function mountProjects({
  filters = '[data-project-filters]',
  grid = '[data-projects]',
  empty = '[data-projects-empty]',
} = {}) {
  const filtersEl = qs(filters);
  const gridEl = qs(grid);
  const emptyEl = qs(empty);
  if (!gridEl) return;

  render(gridEl, projects.map(projectCard).join(''));
  qsa('a svg', gridEl).forEach((svg) => svg.classList.add('btn__icon', 'btn__icon--arrow'));

  if (filtersEl) {
    const categories = getUsedCategories();
    render(
      filtersEl,
      categories.map((category) => filterButton(category, category.id === 'all')).join('')
    );

    filtersEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;

      qsa('[data-filter]', filtersEl).forEach((item) =>
        item.setAttribute('aria-pressed', String(item === button))
      );
      applyFilter(gridEl, emptyEl, button.dataset.filter);

      // Relance l'animation d'entrée des cartes restées visibles
      gridEl.classList.remove('is-refresh');
      void gridEl.offsetWidth;
      gridEl.classList.add('is-refresh');

      observeReveals(gridEl);
    });
  }

  if (emptyEl) emptyEl.hidden = true;
}
