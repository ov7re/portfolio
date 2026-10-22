/** Compte : mot de passe et sessions. Journal d'activité. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { get, post } from '../api.js';
import { store } from '../store.js';
import { busy, timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Compte';

export async function render(view) {
  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Compte</h1>
        <p>Connecté en tant que <strong>${e(store.session.username)}</strong>.</p>
      </div>
    </header>
    <section class="card">
      <h2 class="card__title">Changer le mot de passe</h2>
      <form class="form" data-password style="max-width:420px">
        <label class="f"><span class="f__label">Mot de passe actuel</span><input class="input" type="password" name="current" autocomplete="current-password" required></label>
        <label class="f"><span class="f__label">Nouveau mot de passe</span><input class="input" type="password" name="next" autocomplete="new-password" minlength="12" required><small class="f__help">12 caractères minimum. Les autres sessions seront déconnectées.</small></label>
        <div><button class="btn btn--primary" type="submit">${icon('lock')}Mettre à jour</button></div>
      </form>
    </section>
    <section class="card">
      <h2 class="card__title">Sessions</h2>
      <p class="muted" style="margin-bottom:12px">Déconnecte tous les appareils sauf celui-ci (ordinateur perdu, session oubliée…).</p>
      <button class="btn btn--danger" type="button" data-logout-all>${icon('logout')}Déconnecter les autres sessions</button>
    </section>`;

  const form = view.querySelector('[data-password]');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    busy(form.querySelector('button'), async () => {
      try {
        await post('/account/password', { current: form.elements.current.value, next: form.elements.next.value });
        form.reset();
        toast('Mot de passe modifié', 'Les autres sessions ont été déconnectées.');
      } catch (error) {
        toastError(error);
      }
    });
  });

  view.querySelector('[data-logout-all]').addEventListener('click', (event) =>
    busy(event.currentTarget, async () => {
      try {
        await post('/account/logout-all');
        toast('Autres sessions déconnectées');
      } catch (error) {
        toastError(error);
      }
    }));
  return {};
}

export async function renderActivity(view) {
  const log = await get('/activity');
  view.innerHTML = `
    <header class="view__head"><div><h1>Journal</h1><p>Les 200 dernières actions effectuées dans le logiciel.</p></div></header>
    <section class="card">
      ${log.length ? `<div class="list">${log.map((a) => `
        <div class="list__row">
          <span><strong style="font-weight:500">${e(a.action)}</strong> <small>${e(a.detail || '')}</small></span>
          <small title="${e(new Date(a.at).toLocaleString('fr-FR'))}">${e(timeAgo(a.at))}</small>
        </div>`).join('')}</div>` : '<p class="muted">Aucune activité.</p>'}
    </section>`;
  return {};
}
