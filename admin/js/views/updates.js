/** Mises à jour du code (git) : vérifier, installer, redémarrer. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { get, post } from '../api.js';
import { busy, confirmDialog, timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Mises à jour';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Attend que le serveur réponde de nouveau après son redémarrage. */
async function waitForRestart() {
  await wait(2500);
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' });
      if (res.ok) return true;
    } catch {
      /* serveur encore arrêté */
    }
    await wait(1500);
  }
  return false;
}

export async function render(view, { rerender }) {
  view.innerHTML = '<div class="loading"><span class="spin"></span></div>';
  let status;
  try {
    status = await get('/updates?fetch');
  } catch (error) {
    view.innerHTML = `<div class="notice notice--danger">${icon('alert')}<div>${e(error.message)}</div></div>`;
    return {};
  }

  const head = `
    <header class="view__head">
      <div>
        <h1>Mises à jour</h1>
        <p>Installe la dernière version du code depuis le dépôt git (<code class="code">${e(status.target)}</code>). Le site et le logiciel sont mis à jour sans intervention sur le NAS.</p>
      </div>
      ${status.enabled && status.ready ? `<div class="view__actions"><button class="btn" type="button" data-check>${icon('refresh')}Rechercher</button></div>` : ''}
    </header>`;

  if (!status.enabled) {
    view.innerHTML = `${head}
      <div class="notice">${icon('info')}<div>
        <strong>Mises à jour désactivées.</strong> Pour les activer sur le NAS :
        <ol style="margin:8px 0 0 18px;list-style:decimal;display:grid;gap:4px">
          <li>Cloner le dépôt sur le NAS et lancer <code>docker compose</code> depuis ce dossier (il est monté dans le conteneur).</li>
          <li>Dans le fichier <code>.env</code>, définir <code>UPDATES_ENABLED=true</code>.</li>
          <li>Redémarrer : <code>docker compose up -d</code>.</li>
        </ol>
      </div></div>`;
    return {};
  }

  if (!status.ready) {
    view.innerHTML = `${head}<div class="notice notice--danger">${icon('alert')}<div>${e(status.error)}</div></div>`;
    return {};
  }

  const { current, pending } = status;
  view.innerHTML = `${head}
    ${status.error ? `<div class="notice notice--danger" style="margin-bottom:14px">${icon('alert')}<div>Vérification impossible : ${e(status.error)}</div></div>` : ''}
    ${status.dirty ? `<div class="notice notice--warn" style="margin-bottom:14px">${icon('alert')}<div>Des fichiers ont été modifiés directement sur le NAS. L’installation échouera s’ils entrent en conflit avec la mise à jour.</div></div>` : ''}

    <div class="grid grid--2">
      <section class="card">
        <h2 class="card__title">Version installée <span class="chip chip--plain mono">${e(status.branch)}</span></h2>
        <div class="commit"><code>${e(current.short)}</code><span>${e(current.subject)}</span><small>${e(timeAgo(current.date))}</small></div>
      </section>
      <section class="card">
        <h2 class="card__title">Disponible ${pending.length ? `<span class="chip chip--warn">${pending.length} nouveauté(s)</span>` : '<span class="chip chip--ok">À jour</span>'}</h2>
        ${pending.length ? `
          <label class="switch"><input type="checkbox" data-maintenance checked><span class="switch__track"></span><span>Maintenance pendant l’installation</span></label>
          <div style="margin-top:14px"><button class="btn btn--primary" type="button" data-apply>${icon('cloud')}Installer la mise à jour</button></div>`
        : `<p class="muted">Aucune mise à jour. Dernière vérification ${status.lastCheck ? e(timeAgo(status.lastCheck)) : 'à l’instant'}.</p>`}
      </section>
    </div>

    ${pending.length ? `
      <section class="card">
        <h2 class="card__title">Changements</h2>
        ${pending.map((c) => `<div class="commit"><code>${e(c.short)}</code><span>${e(c.subject)}</span><small>${e(c.author)} · ${e(timeAgo(c.date))}</small></div>`).join('')}
      </section>` : ''}

    <section class="card">
      <h2 class="card__title">Historique des installations</h2>
      ${status.history.length ? `<div class="list">${status.history.map((h) => `
        <div class="list__row">
          <span>${h.ok ? `<span class="mono">${e(h.from)} → ${e(h.to)}</span> <small>${h.files} fichier(s)${h.restart ? ', redémarrage' : ''}</small>` : `<span style="color:var(--danger)">Échec</span> <small>${e(h.error)}</small>`}</span>
          <small>${e(timeAgo(h.at))}</small>
        </div>`).join('')}</div>` : '<p class="muted">Aucune installation pour le moment.</p>'}
    </section>`;

  view.querySelector('[data-check]')?.addEventListener('click', rerender);

  view.querySelector('[data-apply]')?.addEventListener('click', async (event) => {
    const ok = await confirmDialog({
      title: 'Installer la mise à jour ?',
      text: `${pending.length} changement(s) seront appliqués. Si le serveur doit redémarrer, le logiciel se reconnectera tout seul.`,
      confirm: 'Installer',
    });
    if (!ok) return;
    const maintenance = view.querySelector('[data-maintenance]').checked;
    await busy(event.target.closest('button'), async () => {
      try {
        const res = await post('/updates/apply', { maintenance });
        if (res.restart) {
          view.innerHTML = `<div class="loading"><div style="display:grid;place-items:center;gap:14px"><span class="spin"></span><p>Redémarrage du serveur…</p></div></div>`;
          const back = await waitForRestart();
          if (back) {
            toast('Mise à jour installée', 'Le serveur a redémarré.');
            location.reload();
          } else {
            toastError(new Error('Le serveur ne répond pas après la mise à jour. Vérifiez les journaux Docker sur le NAS.'));
          }
        } else {
          toast('Mise à jour installée', `${res.files.length} fichier(s) mis à jour.`);
          rerender();
        }
      } catch (error) {
        toastError(error);
      }
    });
  });
  return {};
}
