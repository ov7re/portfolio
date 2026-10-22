/** Explorateur de projets : bibliothèque filtrable et fiche détaillée. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e, paragraphs, safeHref } from '/shared/util.js';
import { cover } from '../ui.js';

export default {
  id: 'projects',
  route: 'projets',
  title: 'Projets',
  icon: 'folder',
  tone: 'gold',
  size: [1040, 680],
  maximized: true,
  subRoutes: true,

  render(body, { content, os, params }) {
    const { items, categories } = content.projects;
    const labelOf = (id) => categories.find((c) => c.id === id)?.label || id;
    const state = { filter: 'all', query: '', current: null };

    body.innerHTML = `
      <div class="explorer">
        <div class="explorer__bar">
          <button class="icon-btn" type="button" data-act="back" aria-label="Retour">${icon('arrowLeft')}</button>
          <nav class="crumbs" aria-label="Emplacement"></nav>
          <label class="searchbox">${icon('search')}<input type="search" placeholder="Rechercher" aria-label="Rechercher un projet"></label>
        </div>
        <aside class="explorer__side" aria-label="Catégories"></aside>
        <div class="explorer__main" tabindex="-1"></div>
      </div>`;

    const crumbs = body.querySelector('.crumbs');
    const side = body.querySelector('.explorer__side');
    const main = body.querySelector('.explorer__main');
    const back = body.querySelector('[data-act="back"]');
    const search = body.querySelector('input[type="search"]');

    const featured = items.filter((p) => p.featured);
    const filters = [
      { id: 'all', label: 'Tous les projets', icon: 'grid', count: items.length },
      ...(featured.length ? [{ id: 'featured', label: 'À la une', icon: 'star', count: featured.length }] : []),
    ];
    const cats = categories
      .map((c) => ({ ...c, icon: 'folder', count: items.filter((p) => p.categories.includes(c.id)).length }))
      .filter((c) => c.count);

    function renderSide() {
      const link = (f) => `
        <button class="side-link" type="button" data-filter="${e(f.id)}" aria-current="${!state.current && state.filter === f.id}">
          ${icon(f.icon)}<span>${e(f.label)}</span><span class="count">${f.count}</span>
        </button>`;
      side.innerHTML = `
        <p class="side-title">Bibliothèque</p>${filters.map(link).join('')}
        ${cats.length ? `<p class="side-title" style="margin-top:18px">Catégories</p>${cats.map(link).join('')}` : ''}`;
    }

    function visible() {
      const q = state.query.trim().toLowerCase();
      return items.filter((p) => {
        if (state.filter === 'featured' && !p.featured) return false;
        if (!['all', 'featured'].includes(state.filter) && !p.categories.includes(state.filter)) return false;
        if (!q) return true;
        return [p.name, p.summary, p.status, ...p.tech, ...p.categories.map(labelOf)].join(' ').toLowerCase().includes(q);
      });
    }

    function renderList() {
      state.current = null;
      os.setTitle('Projets');
      back.disabled = true;
      const filterLabel = [...filters, ...cats].find((f) => f.id === state.filter)?.label;
      crumbs.innerHTML = `${icon('folder')}<strong>Projets</strong>${state.filter !== 'all' ? `${icon('chevronRight')}<strong>${e(filterLabel)}</strong>` : ''}`;
      const list = visible();
      main.innerHTML = list.length
        ? `<div class="projects-grid">${list.map((p) => `
            <button class="pcard" type="button" data-project="${e(p.id)}">
              ${cover(p)}
              <div class="pcard__body">
                <h3>${e(p.name)}</h3>
                <p>${e(p.summary)}</p>
                <div class="pcard__meta">
                  <span>${e(p.categories.map(labelOf).join(' · '))}</span>
                  ${p.year ? `<span class="mono">${e(p.year)}</span>` : ''}
                </div>
              </div>
            </button>`).join('')}</div>`
        : `<div class="empty">${icon('search')}<p>Aucun projet ne correspond à « ${e(state.query)} ».</p></div>`;
      renderSide();
    }

    function renderDetail(id) {
      const index = items.findIndex((p) => p.id === id);
      const p = items[index];
      back.disabled = false;
      if (!p) {
        crumbs.innerHTML = `${icon('folder')}<button type="button" data-crumb="root">Projets</button>`;
        main.innerHTML = `<div class="empty">${icon('alert')}<p>Ce projet n’existe pas ou n’est plus affiché.</p>
          <button class="btn" type="button" data-crumb="root">Voir tous les projets</button></div>`;
        return;
      }
      state.current = id;
      os.setTitle('Projets', p.name);
      crumbs.innerHTML = `${icon('folder')}<button type="button" data-crumb="root">Projets</button>${icon('chevronRight')}<strong>${e(p.name)}</strong>`;

      const prev = items[(index - 1 + items.length) % items.length];
      const next = items[(index + 1) % items.length];
      const links = p.links.filter((l) => safeHref(l.href));

      main.innerHTML = `
        <article class="project">
          <div class="project__hero">${cover(p, { label: false })}</div>
          <header class="project__head">
            <div>
              <p class="kicker">${e(p.categories.map(labelOf).join(' · '))}${p.year ? ` · ${e(p.year)}` : ''}</p>
              <h1 class="h1" style="margin-top:8px">${e(p.name)}</h1>
            </div>
            ${p.status ? `<span class="chip chip--accent">${icon('dot')}${e(p.status)}</span>` : ''}
          </header>
          <p class="lead" style="margin-top:12px">${e(p.summary)}</p>
          ${links.length ? `<div class="widget__actions">${links.map((l) => `
            <a class="btn" href="${e(safeHref(l.href))}" target="_blank" rel="noopener">${icon('external')}${e(l.label || 'Voir')}</a>`).join('')}</div>` : ''}

          ${p.presentation ? `<section class="section"><h2 class="h2">Présentation</h2><div class="prose">${paragraphs(p.presentation)}</div></section>` : ''}

          ${p.problem || p.solution ? `
            <section class="section project__cols">
              ${p.problem ? `<div class="card"><h3>Le besoin</h3><p>${e(p.problem)}</p></div>` : ''}
              ${p.solution ? `<div class="card"><h3>La solution</h3><p>${e(p.solution)}</p></div>` : ''}
            </section>` : ''}

          ${p.features.length ? `
            <section class="section"><h2 class="h2">Fonctionnalités</h2>
              <ul class="features">${p.features.map((f) => `<li>${icon('check')}<span>${e(f)}</span></li>`).join('')}</ul>
            </section>` : ''}

          ${p.architecture.length ? `
            <section class="section"><h2 class="h2">Architecture</h2>
              <ol class="arch">${p.architecture.map((a) => `<li><h4>${e(a.title)}</h4><p>${e(a.text)}</p></li>`).join('')}</ol>
            </section>` : ''}

          ${p.tech.length ? `
            <section class="section"><h2 class="h2">Technologies</h2>
              <div class="chips">${p.tech.map((t) => `<span class="chip chip--mono">${e(t)}</span>`).join('')}</div>
            </section>` : ''}

          ${p.screenshots.length ? `
            <section class="section"><h2 class="h2">Captures</h2>
              <div class="shots">${p.screenshots.filter((s) => s.src).map((s) => `
                <figure><img src="${e(s.src)}" alt="${e(s.caption || p.name)}" loading="lazy">${s.caption ? `<figcaption>${e(s.caption)}</figcaption>` : ''}</figure>`).join('')}
              </div>
            </section>` : ''}

          ${p.result ? `<section class="section"><h2 class="h2">Résultat</h2><p class="lead">${e(p.result)}</p></section>` : ''}
          ${p.note ? `<div class="callout section">${icon('info')}<p>${e(p.note)}</p></div>` : ''}

          <div class="cta">
            <div><strong>Un projet similaire ?</strong><p class="muted">Parlons de votre besoin.</p></div>
            <button class="btn btn--primary" type="button" data-open="contact">${icon('send')}Demander un devis</button>
          </div>

          ${items.length > 1 ? `
            <nav class="project__nav" aria-label="Projets voisins">
              <button type="button" data-project="${e(prev.id)}"><small>← Précédent</small><strong>${e(prev.name)}</strong></button>
              <button type="button" data-project="${e(next.id)}"><small>Suivant →</small><strong>${e(next.name)}</strong></button>
            </nav>` : ''}
        </article>`;
      renderSide();
      main.scrollTop = 0;
    }

    function openProject(id) {
      renderDetail(id);
      os.navigate(id);
    }

    function openList() {
      renderList();
      os.navigate('');
      main.scrollTop = 0;
    }

    body.addEventListener('click', (event) => {
      const project = event.target.closest('[data-project]');
      if (project) return openProject(project.dataset.project);
      const filter = event.target.closest('[data-filter]');
      if (filter) {
        state.filter = filter.dataset.filter;
        return openList();
      }
      if (event.target.closest('[data-crumb="root"]')) {
        state.filter = 'all';
        return openList();
      }
      if (event.target.closest('[data-open="contact"]')) {
        const p = items.find((x) => x.id === state.current);
        os.open('contact', { about: p?.name });
      }
    });

    back.addEventListener('click', () => state.current && openList());

    search.addEventListener('input', () => {
      state.query = search.value;
      if (state.current) os.navigate('');
      renderList();
    });

    if (params.sub) renderDetail(params.sub);
    else renderList();

    return {
      update(next) {
        if (next.sub && next.sub !== state.current) renderDetail(next.sub);
        else if (!next.sub && state.current) renderList();
      },
    };
  },
};
