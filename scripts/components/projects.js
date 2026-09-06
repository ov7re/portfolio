/**
 * Section projets : filtres et liste.
 * Les lignes et les filtres sont entièrement dérivés de scripts/data/projects.js.
 */

import { qs, qsa, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { projects, getUsedCategories } from '../data/projects.js';
import { t } from '../i18n/index.js';

function projectRow(project, index) {
  const number = String(index + 1).padStart(2, '0');

  return html`
    <article
      class="project-row"
      data-project-card
      data-anim="fade"
      data-categories="${project.categories.join(' ')}"
    >
      <span class="project-row__num">${number}</span>
      <h3 class="project-row__name">${project.name}</h3>
      <span class="project-row__meta">
        <span>${project.primaryLabel}</span>
        <span>${project.status}</span>
      </span>
      <a
        class="project-row__link project-row__go"
        href="projet.html?id=${project.id}"
        aria-label="${project.name} — ${t('common.viewProject', 'Voir le projet')}"
      >
        ${raw(icon('arrowRight'))}
      </a>
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

function applyFilter(list, emptyState, value) {
  let visible = 0;

  qsa('[data-project-card]', list).forEach((row) => {
    const matches = value === 'all' || row.dataset.categories.split(' ').includes(value);
    row.classList.toggle('is-hidden', !matches);
    if (matches) visible += 1;
  });

  if (emptyState) emptyState.hidden = visible > 0;
}

export function mountProjects({
  filters = '[data-project-filters]',
  list = '[data-projects]',
  empty = '[data-projects-empty]',
} = {}) {
  const filtersEl = qs(filters);
  const listEl = qs(list);
  const emptyEl = qs(empty);
  if (!listEl) return;

  render(listEl, projects.map(projectRow).join(''));

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
      applyFilter(listEl, emptyEl, button.dataset.filter);

      // Relance l'animation d'entrée des lignes restées visibles
      listEl.classList.remove('is-refresh');
      void listEl.offsetWidth;
      listEl.classList.add('is-refresh');
    });
  }

  if (emptyEl) emptyEl.hidden = true;
}
