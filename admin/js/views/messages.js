/** Messages reçus via le formulaire de contact du site. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { del, get, patch } from '../api.js';
import { update } from '../store.js';
import { confirmDialog, timeAgo, toast, toastError } from '../ui.js';

export const title = () => 'Messages';

export async function render(view, { query }) {
  let messages = await get('/messages');
  let currentId = query.get('id') || messages[0]?.id || null;

  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Messages</h1>
        <p>Demandes envoyées depuis l’application Contact du site.</p>
      </div>
    </header>
    <div data-body></div>`;
  const holder = view.querySelector('[data-body]');

  const syncUnread = () => update({ unread: messages.filter((m) => !m.read).length });

  function draw() {
    if (!messages.length) {
      holder.innerHTML = `<div class="card empty">${icon('inbox')}<p>Aucun message pour le moment.</p></div>`;
      return;
    }
    const current = messages.find((m) => m.id === currentId) || messages[0];
    currentId = current.id;
    const subject = encodeURIComponent(`Re : votre demande${current.type ? ` (${current.type})` : ''}`);
    holder.innerHTML = `
      <div class="inbox">
        <div class="inbox__list" role="list">
          ${messages.map((m) => `
            <button class="msg${m.read ? '' : ' is-unread'}" type="button" role="listitem" data-id="${e(m.id)}" aria-current="${m.id === currentId}">
              <span class="msg__top"><strong>${e(m.name)}</strong><small>${e(timeAgo(m.createdAt))}</small></span>
              <small>${e(m.type || 'Sans type')}</small>
              <p>${e(m.message)}</p>
            </button>`).join('')}
        </div>
        <article class="inbox__read">
          <div class="view__head" style="margin:0">
            <div>
              <h2 style="font-size:18px;font-weight:600">${e(current.name)}</h2>
              <p class="muted">${e(new Date(current.createdAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }))}</p>
            </div>
            <div class="view__actions">
              <a class="btn btn--primary btn--sm" href="mailto:${e(current.email)}?subject=${subject}">${icon('send')}Répondre</a>
              <button class="btn btn--sm" type="button" data-unread>${icon('mail')}Marquer non lu</button>
              <button class="icon-btn icon-btn--danger" type="button" data-delete title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>
            </div>
          </div>
          <dl class="meta">
            <dt>E-mail</dt><dd><a href="mailto:${e(current.email)}">${e(current.email)}</a></dd>
            ${current.type ? `<dt>Type</dt><dd>${e(current.type)}</dd>` : ''}
            ${current.budget ? `<dt>Budget</dt><dd>${e(current.budget)}</dd>` : ''}
            ${current.deadline ? `<dt>Délai</dt><dd>${e(current.deadline)}</dd>` : ''}
          </dl>
          <div class="message-body">${e(current.message)}</div>
        </article>
      </div>`;

    if (!current.read) markRead(current, true);
  }

  async function markRead(message, read) {
    try {
      await patch(`/messages/${message.id}`, { read });
      message.read = read;
      syncUnread();
      holder.querySelector(`[data-id="${CSS.escape(message.id)}"]`)?.classList.toggle('is-unread', !read);
    } catch (error) {
      toastError(error);
    }
  }

  holder.addEventListener('click', async (event) => {
    const item = event.target.closest('[data-id]');
    if (item) {
      currentId = item.dataset.id;
      return draw();
    }
    const current = messages.find((m) => m.id === currentId);
    if (event.target.closest('[data-unread]')) {
      await markRead(current, false);
      toast('Marqué comme non lu');
    }
    if (event.target.closest('[data-delete]')) {
      const ok = await confirmDialog({ title: 'Supprimer ce message ?', text: `Message de ${current.name}. Cette action est définitive.`, confirm: 'Supprimer', danger: true });
      if (!ok) return;
      try {
        await del(`/messages/${current.id}`);
        messages = messages.filter((m) => m.id !== current.id);
        currentId = messages[0]?.id || null;
        syncUnread();
        draw();
        toast('Message supprimé');
      } catch (error) {
        toastError(error);
      }
    }
  });

  draw();
  return {};
}
