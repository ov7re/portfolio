/** Déploiement du brouillon et historique des versions. */

import { icon } from '/shared/icons.js';
import { getSection } from '/shared/schema.js';
import { escapeHtml as e } from '/shared/util.js';
import { get, post } from '../api.js';
import { refreshContent, store, update } from '../store.js';
import { busy, confirmDialog, timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Déploiement';

const labels = (keys) => keys.map((k) => getSection(k)?.label || k).join(', ');

export async function render(view, { openPreview, rerender }) {
  const { releases, liveId } = await get('/releases');
  const { pending } = store;

  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Déploiement</h1>
        <p>Les modifications sont enregistrées dans un brouillon. Déployer les publie sur le site en une seule fois ; chaque déploiement crée une version que vous pouvez restaurer.</p>
      </div>
    </header>

    <section class="card">
      <h2 class="card__title">Brouillon ${pending.length ? `<span class="chip chip--warn">${pending.length} section(s) modifiée(s)</span>` : '<span class="chip chip--ok">À jour</span>'}</h2>
      ${pending.length ? `
        <div class="list">
          ${pending.map((k) => `
            <div class="list__row">
              <span>${e(getSection(k)?.label || k)}</span>
              <a class="btn btn--sm" href="#/contenu/${e(k)}">${icon('pencil')}Ouvrir</a>
            </div>`).join('')}
        </div>
        <div class="form" style="margin-top:18px">
          <label class="f">
            <span class="f__label">Note de version <span class="muted">facultatif</span></span>
            <input class="input" data-note maxlength="300" placeholder="Ex. : ajout de l’avis de Marie, nouveau projet VaultDesk">
          </label>
          <div class="view__actions">
            <button class="btn" type="button" data-preview>${icon('eye')}Prévisualiser le brouillon</button>
            <button class="btn btn--primary" type="button" data-deploy>${icon('cloud')}Déployer en production</button>
          </div>
        </div>`
      : `<p class="muted">Aucune modification en attente : le site en ligne correspond au brouillon.</p>`}
    </section>

    <section class="card">
      <h2 class="card__title">Historique <small>${releases.length} version(s) conservée(s)</small></h2>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Version</th><th>Date</th><th>Note</th><th></th></tr></thead>
          <tbody>
            ${releases.map((r) => `
              <tr>
                <td><strong class="mono">v${r.version}</strong> ${r.id === liveId ? '<span class="chip chip--ok">En ligne</span>' : ''}</td>
                <td><span title="${e(new Date(r.createdAt).toLocaleString('fr-FR'))}">${e(timeAgo(r.createdAt))}</span></td>
                <td>${e(r.note)}<br><small class="muted">${e(labels(r.sections || []))}</small></td>
                <td>
                  <button class="btn btn--sm" type="button" data-draft="${e(r.id)}" title="Copier cette version dans le brouillon">${icon('pencil')}Brouillon</button>
                  ${r.id !== liveId ? `<button class="btn btn--sm" type="button" data-rollback="${e(r.id)}">${icon('history')}Remettre en ligne</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;

  view.querySelector('[data-preview]')?.addEventListener('click', openPreview);

  view.querySelector('[data-deploy]')?.addEventListener('click', async (event) => {
    const ok = await confirmDialog({
      title: 'Déployer en production ?',
      text: `Sections publiées : ${labels(pending)}. Le site sera mis à jour immédiatement.`,
      confirm: 'Déployer',
    });
    if (!ok) return;
    await busy(event.target.closest('button'), async () => {
      try {
        const res = await post('/deploy', { note: view.querySelector('[data-note]').value });
        update({ pending: res.pending, release: res.release });
        await refreshContent();
        toast(`Version v${res.release.version} en ligne`, 'Le site affiche désormais le nouveau contenu.');
        rerender();
      } catch (error) {
        toastError(error);
      }
    });
  });

  view.addEventListener('click', async (event) => {
    const rollback = event.target.closest('[data-rollback]')?.dataset.rollback;
    const draft = event.target.closest('[data-draft]')?.dataset.draft;
    if (rollback) {
      const r = releases.find((x) => x.id === rollback);
      const ok = await confirmDialog({
        title: `Remettre la v${r.version} en ligne ?`,
        text: 'Le site affichera aussitôt le contenu de cette version. Votre brouillon n’est pas modifié.',
        confirm: 'Remettre en ligne',
      });
      if (!ok) return;
      try {
        const res = await post(`/releases/${rollback}/rollback`);
        await refreshContent();
        toast(`v${r.version} restaurée`, `Publiée sous la v${res.release.version}.`);
        rerender();
      } catch (error) {
        toastError(error);
      }
    }
    if (draft) {
      const r = releases.find((x) => x.id === draft);
      const ok = await confirmDialog({
        title: `Charger la v${r.version} dans le brouillon ?`,
        text: 'Le brouillon actuel sera remplacé. Rien n’est publié tant que vous ne déployez pas.',
        confirm: 'Remplacer le brouillon',
        danger: true,
      });
      if (!ok) return;
      try {
        await post(`/releases/${draft}/draft`);
        await refreshContent();
        toast('Brouillon remplacé', `Contenu de la v${r.version} chargé.`);
        rerender();
      } catch (error) {
        toastError(error);
      }
    }
  });
  return {};
}
