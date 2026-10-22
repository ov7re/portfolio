/** Tableau de bord : état du site en un coup d'œil. */

import { icon } from '/shared/icons.js';
import { getSection } from '/shared/schema.js';
import { escapeHtml as e } from '/shared/util.js';
import { put } from '../api.js';
import { refreshCounters, update } from '../store.js';
import { timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Tableau de bord';

export async function render(view, { openPreview }) {
  const data = await refreshCounters();
  const { release, pending, messages, maintenance, stats, counts, activity } = data;
  const views7 = stats.slice(-7).reduce((n, d) => n + d.views, 0);
  const visitors7 = stats.slice(-7).reduce((n, d) => n + d.visitors, 0);
  const max = Math.max(1, ...stats.map((d) => d.views));

  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Bonjour 👋</h1>
        <p>Le site <a href="${e(data.siteUrl)}" target="_blank" rel="noopener">${e(data.siteUrl.replace(/^https?:\/\//, ''))}</a> est en version <strong>v${release.version}</strong>, déployée ${e(timeAgo(release.createdAt))}.</p>
      </div>
      <div class="view__actions">
        <a class="btn" href="#/contenu/reviews?ajouter">${icon('star')}Ajouter un avis</a>
        <a class="btn" href="#/contenu/projects?ajouter">${icon('folder')}Ajouter un projet</a>
      </div>
    </header>

    <div class="grid grid--4">
      <a class="card stat" href="#/deploiement">
        <span class="stat__label">${icon('cloud')}Brouillon</span>
        <span class="stat__value">${pending.length ? `${pending.length} section${pending.length > 1 ? 's' : ''}` : 'À jour'}</span>
        <span class="stat__hint">${pending.length ? 'modifiée(s), à déployer' : 'identique au site en ligne'}</span>
      </a>
      <a class="card stat" href="#/messages">
        <span class="stat__label">${icon('inbox')}Messages</span>
        <span class="stat__value">${messages.unread}</span>
        <span class="stat__hint">non lu(s) sur ${messages.total}</span>
      </a>
      <div class="card stat">
        <span class="stat__label">${icon('chart')}Visites (7 j)</span>
        <span class="stat__value">${views7}</span>
        <span class="stat__hint">${visitors7} visiteur(s) unique(s)</span>
      </div>
      <div class="card stat">
        <span class="stat__label">${icon('wrench')}Maintenance</span>
        <label class="switch" style="margin-top:6px">
          <input type="checkbox" data-maintenance ${maintenance.enabled ? 'checked' : ''}>
          <span class="switch__track"></span><span data-maintenance-label>${maintenance.enabled ? 'Site en maintenance' : 'Site en ligne'}</span>
        </label>
        <a class="stat__hint" href="#/maintenance">Personnaliser le message</a>
      </div>
    </div>

    ${pending.length ? `
      <div class="notice notice--warn" style="margin-top:14px">
        ${icon('alert')}
        <div style="flex:1">
          <strong>Modifications non déployées :</strong> ${pending.map((k) => e(getSection(k)?.label || k)).join(', ')}.
          Elles ne sont pas encore visibles sur le site.
        </div>
        <button class="btn btn--sm" type="button" data-preview>${icon('eye')}Prévisualiser</button>
        <a class="btn btn--primary btn--sm" href="#/deploiement">${icon('cloud')}Déployer</a>
      </div>` : ''}

    <div class="grid grid--2" style="margin-top:14px">
      <section class="card">
        <h2 class="card__title">Fréquentation <small>14 derniers jours</small></h2>
        <div class="bars" role="img" aria-label="Pages vues par jour">
          ${stats.map((d) => `
            <div class="bars__col" title="${e(d.day)} : ${d.views} vue(s), ${d.visitors} visiteur(s)">
              <span class="bars__bar" style="height:${Math.round((d.views / max) * 100)}%"></span>
              <small>${Number(d.day.slice(8))}</small>
            </div>`).join('')}
        </div>
      </section>
      <section class="card">
        <h2 class="card__title">Activité récente <a class="btn btn--ghost btn--sm" href="#/journal">Tout voir</a></h2>
        ${activity.length ? `<div class="list">${activity.map((a) => `
          <div class="list__row"><span><strong style="font-weight:500">${e(a.action)}</strong> <small>${e(a.detail || '')}</small></span><small>${e(timeAgo(a.at))}</small></div>`).join('')}</div>`
          : '<p class="muted">Aucune activité pour le moment.</p>'}
      </section>
    </div>

    <section class="card" style="margin-top:14px">
      <h2 class="card__title">Contenu</h2>
      <div class="list">
        <div class="list__row"><span>Projets</span><small>${counts.projects}</small><a class="btn btn--sm" href="#/contenu/projects">Gérer</a></div>
        <div class="list__row"><span>Avis clients</span><small>${counts.reviews}${counts.reviewsHidden ? ` (dont ${counts.reviewsHidden} masqué${counts.reviewsHidden > 1 ? 's' : ''})` : ''}</small><a class="btn btn--sm" href="#/contenu/reviews">Gérer</a></div>
      </div>
    </section>`;

  view.querySelector('[data-preview]')?.addEventListener('click', openPreview);

  const toggle = view.querySelector('[data-maintenance]');
  toggle.addEventListener('change', async () => {
    try {
      const next = await put('/maintenance', { enabled: toggle.checked });
      update({ maintenance: next.enabled });
      view.querySelector('[data-maintenance-label]').textContent = next.enabled ? 'Site en maintenance' : 'Site en ligne';
      toast(next.enabled ? 'Maintenance activée' : 'Site de nouveau en ligne');
    } catch (error) {
      toggle.checked = !toggle.checked;
      toastError(error);
    }
  });
  return {};
}
