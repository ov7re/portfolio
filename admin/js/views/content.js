/** Éditeur d'une section du contenu (brouillon), généré depuis le schéma. */

import { icon } from '/shared/icons.js';
import { getSection } from '/shared/schema.js';
import { escapeHtml as e } from '/shared/util.js';
import { post, put } from '../api.js';
import { buildForm } from '../form.js';
import { store, update } from '../store.js';
import { busy, confirmDialog, toast, toastError } from '../ui.js';

export async function render(view, { params, query }) {
  const section = getSection(params.key);
  if (!section) {
    view.innerHTML = `<div class="empty">${icon('alert')}<p>Section inconnue.</p></div>`;
    return {};
  }

  let value = structuredClone(store.draft[section.key]);
  let dirty = false;

  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>${e(section.label)}</h1>
        <p>${e(section.description)}</p>
      </div>
      <div class="view__actions">
        <span class="chip" data-status></span>
        <button class="btn btn--sm" type="button" data-discard>${icon('history')}Revenir à la version en ligne</button>
      </div>
    </header>
    <div class="card" data-form></div>
    <div class="savebar" role="region" aria-label="Modifications non enregistrées">
      <span>Modifications non enregistrées</span>
      <div class="view__actions">
        <button class="btn btn--ghost btn--sm" type="button" data-reset>Annuler</button>
        <button class="btn btn--primary btn--sm" type="button" data-save>${icon('save')}Enregistrer <kbd class="mono" style="opacity:.7;font-size:11px">Ctrl S</kbd></button>
      </div>
    </div>`;

  const holder = view.querySelector('[data-form]');
  const savebar = view.querySelector('.savebar');
  const status = view.querySelector('[data-status]');
  const discardBtn = view.querySelector('[data-discard]');

  function paintStatus() {
    const pending = store.pending.includes(section.key);
    status.className = `chip ${dirty ? 'chip--warn' : pending ? 'chip--warn' : 'chip--ok'}`;
    status.textContent = dirty ? 'Non enregistré' : pending ? 'Brouillon — non déployé' : 'Identique au site en ligne';
    discardBtn.hidden = !pending;
    savebar.classList.toggle('is-visible', dirty);
  }

  function mount() {
    holder.innerHTML = '';
    const form = buildForm(section.fields, value, {
      onChange() {
        dirty = true;
        paintStatus();
      },
    });
    holder.append(form);
    return form;
  }

  async function save() {
    if (!dirty) return;
    await busy(view.querySelector('[data-save]'), async () => {
      try {
        const res = await put(`/content/${section.key}`, { value });
        update({ draft: { ...store.draft, [section.key]: res.value }, pending: res.pending });
        value = structuredClone(res.value);
        dirty = false;
        mount();
        paintStatus();
        toast('Brouillon enregistré', 'Déployez pour publier sur le site.');
      } catch (error) {
        toastError(error);
      }
    });
  }

  view.querySelector('[data-save]').addEventListener('click', save);
  view.querySelector('[data-reset]').addEventListener('click', () => {
    value = structuredClone(store.draft[section.key]);
    dirty = false;
    mount();
    paintStatus();
  });
  discardBtn.addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Revenir à la version en ligne ?',
      text: `Toutes les modifications non déployées de « ${section.label} » seront perdues.`,
      confirm: 'Revenir à la version en ligne',
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await post(`/content/${section.key}/discard`);
      update({ draft: { ...store.draft, [section.key]: res.value }, pending: res.pending });
      value = structuredClone(res.value);
      dirty = false;
      mount();
      paintStatus();
      toast('Modifications annulées');
    } catch (error) {
      toastError(error);
    }
  });

  const onKey = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      save();
    }
  };
  document.addEventListener('keydown', onKey);
  const onUnload = (event) => {
    if (dirty) event.preventDefault();
  };
  addEventListener('beforeunload', onUnload);

  const form = mount();
  paintStatus();

  // Raccourci « Ajouter » depuis le tableau de bord (#/contenu/reviews?ajouter).
  if (query.has('ajouter')) {
    const list = form.querySelector('.items[data-key="items"]');
    list?.addItem?.();
  }

  return {
    canLeave: async () =>
      !dirty || confirmDialog({ title: 'Quitter sans enregistrer ?', text: 'Les modifications de cette page seront perdues.', confirm: 'Quitter', danger: true }),
    destroy() {
      document.removeEventListener('keydown', onKey);
      removeEventListener('beforeunload', onUnload);
    },
  };
}

export const title = (params) => getSection(params.key)?.label || 'Contenu';
