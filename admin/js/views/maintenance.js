/** Mode maintenance : effet immédiat, sans déploiement. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { get, put } from '../api.js';
import { update } from '../store.js';
import { busy, timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Maintenance';

export async function render(view, { rerender }) {
  const m = await get('/maintenance');

  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Maintenance</h1>
        <p>Le site public affiche un écran « mise à jour en cours » et répond avec un code 503, que les moteurs de recherche comprennent comme une interruption temporaire. Le logiciel reste accessible, et l’aperçu du brouillon aussi.</p>
      </div>
    </header>

    <section class="card">
      <div class="card__title">
        <span>État</span>
        ${m.enabled ? `<span class="chip chip--warn">En maintenance${m.since ? ' depuis ' + e(timeAgo(m.since)) : ''}</span>` : '<span class="chip chip--ok">Site en ligne</span>'}
      </div>
      <button class="btn ${m.enabled ? 'btn--primary' : 'btn--danger'}" type="button" data-toggle>
        ${icon(m.enabled ? 'power' : 'wrench')}${m.enabled ? 'Remettre le site en ligne' : 'Activer la maintenance'}
      </button>
    </section>

    <section class="card">
      <h2 class="card__title">Écran affiché aux visiteurs</h2>
      <div class="form">
        <label class="f"><span class="f__label">Titre</span><input class="input" data-field="title" maxlength="120" value="${e(m.title)}"></label>
        <label class="f"><span class="f__label">Message</span><textarea class="textarea" data-field="message" rows="3" maxlength="600">${e(m.message)}</textarea></label>
        <label class="f"><span class="f__label">Retour estimé <span class="muted">facultatif</span></span><input class="input" data-field="eta" maxlength="60" value="${e(m.eta)}" placeholder="Ex. : 18 h 30, demain matin…"></label>
        <div><button class="btn btn--primary" type="button" data-save>${icon('save')}Enregistrer le message</button></div>
      </div>
    </section>`;

  const values = () => Object.fromEntries([...view.querySelectorAll('[data-field]')].map((n) => [n.dataset.field, n.value]));

  view.querySelector('[data-save]').addEventListener('click', (event) =>
    busy(event.currentTarget, async () => {
      try {
        await put('/maintenance', values());
        toast('Message enregistré');
      } catch (error) {
        toastError(error);
      }
    }));

  view.querySelector('[data-toggle]').addEventListener('click', (event) =>
    busy(event.currentTarget, async () => {
      try {
        const next = await put('/maintenance', { ...values(), enabled: !m.enabled });
        update({ maintenance: next.enabled });
        toast(next.enabled ? 'Maintenance activée' : 'Site de nouveau en ligne');
        rerender();
      } catch (error) {
        toastError(error);
      }
    }));
  return {};
}
