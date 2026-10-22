/** Médiathèque : images envoyées sur le NAS, utilisables dans le contenu. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { del, get, post } from '../api.js';
import { confirmDialog, el, formatBytes, modal, readAsDataUrl, toast, toastError } from '../ui.js';

export const title = () => 'Médias';

async function upload(files) {
  const done = [];
  for (const file of files) {
    try {
      done.push(await post('/uploads', { name: file.name, data: await readAsDataUrl(file) }));
    } catch (error) {
      toastError(error);
    }
  }
  if (done.length) toast(`${done.length} image(s) ajoutée(s)`);
  return done;
}

function dropZone(onFiles) {
  const zone = el(`<label class="drop">
    ${icon('upload')}
    <span><strong>Glissez des images ici</strong> ou cliquez pour choisir</span>
    <small class="muted">PNG, JPEG, WebP ou GIF — 8 Mo maximum</small>
    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden>
  </label>`);
  const input = zone.querySelector('input');
  input.addEventListener('change', () => {
    onFiles([...input.files]);
    input.value = '';
  });
  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-over');
    onFiles([...event.dataTransfer.files].filter((f) => f.type.startsWith('image/')));
  });
  return zone;
}

export async function render(view) {
  view.innerHTML = `
    <header class="view__head">
      <div>
        <h1>Médias</h1>
        <p>Images stockées sur le NAS : couvertures et captures de projets. Copiez l’adresse d’une image ou choisissez-la directement depuis un champ « Image ».</p>
      </div>
    </header>
    <div data-drop></div>
    <div class="media-grid" data-grid></div>`;

  const grid = view.querySelector('[data-grid]');
  const draw = async () => {
    const items = await get('/uploads');
    grid.innerHTML = items.length
      ? items.map((m) => `
          <figure class="media">
            <img src="${e(m.url)}" alt="" loading="lazy">
            <figcaption class="media__foot">
              <span title="${e(m.name)}">${e(m.name)} · ${formatBytes(m.size)}</span>
              <button class="icon-btn" type="button" data-copy="${e(m.url)}" title="Copier l’adresse" aria-label="Copier l’adresse">${icon('copy')}</button>
              <button class="icon-btn icon-btn--danger" type="button" data-delete="${e(m.name)}" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>
            </figcaption>
          </figure>`).join('')
      : `<p class="muted" style="grid-column:1/-1">Aucune image pour le moment.</p>`;
  };

  view.querySelector('[data-drop]').append(dropZone(async (files) => {
    await upload(files);
    draw();
  }));

  grid.addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]')?.dataset.copy;
    if (copy) {
      await navigator.clipboard?.writeText(copy);
      toast('Adresse copiée', copy);
    }
    const name = event.target.closest('[data-delete]')?.dataset.delete;
    if (name) {
      const ok = await confirmDialog({
        title: 'Supprimer cette image ?',
        text: 'Si elle est utilisée dans le contenu, elle n’y apparaîtra plus.',
        confirm: 'Supprimer',
        danger: true,
      });
      if (!ok) return;
      try {
        await del(`/uploads/${encodeURIComponent(name)}`);
        toast('Image supprimée');
        draw();
      } catch (error) {
        toastError(error);
      }
    }
  });

  await draw();
  return {};
}

/** Sélecteur d'image pour les champs du formulaire. Résout l'URL choisie ou null. */
export function pickImage() {
  return new Promise((resolve) => {
    const box = el(`<div>
      <h2>Choisir une image</h2>
      <div style="margin-top:14px" data-drop></div>
      <div class="media-grid media-grid--pick" data-grid></div>
      <div class="modal__actions"><button class="btn" type="button" data-cancel>Annuler</button></div>
    </div>`);
    const { close } = modal(box, { wide: true });
    let chosen = null;
    const finish = (url) => {
      chosen = url;
      close();
    };
    const grid = box.querySelector('[data-grid]');
    const draw = async () => {
      const items = await get('/uploads').catch(() => []);
      grid.innerHTML = items.length
        ? items.map((m) => `<figure class="media" data-url="${e(m.url)}" tabindex="0"><img src="${e(m.url)}" alt="${e(m.name)}"><figcaption class="media__foot"><span>${e(m.name)}</span></figcaption></figure>`).join('')
        : '<p class="muted" style="grid-column:1/-1">Aucune image : ajoutez-en une ci-dessus.</p>';
    };
    box.querySelector('[data-drop]').append(dropZone(async (files) => {
      const [first] = await upload(files.slice(0, 1));
      if (first) finish(first.url);
    }));
    grid.addEventListener('click', (event) => {
      const url = event.target.closest('[data-url]')?.dataset.url;
      if (url) finish(url);
    });
    grid.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.dataset.url) finish(event.target.dataset.url);
    });
    box.querySelector('[data-cancel]').addEventListener('click', () => close());
    const observer = new MutationObserver(() => {
      if (!box.isConnected) {
        observer.disconnect();
        resolve(chosen);
      }
    });
    observer.observe(document.body, { childList: true });
    draw();
  });
}
