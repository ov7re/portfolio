/**
 * Moteur de formulaires : construit l'éditeur d'une section à partir de son
 * schéma (shared/schema.js). Les champs modifient directement l'objet `value`
 * fourni, puis appellent `onChange`.
 */

import { ICON_CHOICES, icon } from '/shared/icons.js';
import { emptyItem } from '/shared/schema.js';
import { escapeHtml as e, slugify } from '/shared/util.js';
import { el } from './ui.js';
import { pickImage } from './views/media.js';

const WIDE = new Set(['textarea', 'list', 'tags', 'lines', 'multi', 'icon', 'group', 'image']);

export function buildForm(fields, value, { onChange }) {
  const refreshers = new Set();
  const ctx = {
    root: value,
    changed() {
      for (const fn of refreshers) fn();
      onChange();
    },
    refreshers,
  };
  const form = el('<div class="form-grid"></div>');
  renderFields(form, fields, value, ctx);
  return form;
}

function renderFields(container, fields, obj, ctx) {
  for (const field of fields) {
    const wrap = el(`<div class="f${WIDE.has(field.type) ? ' f--wide' : ''}"></div>`);
    const id = `f-${Math.random().toString(36).slice(2, 9)}`;
    if (field.type !== 'toggle') {
      wrap.append(el(`<label class="f__label" for="${id}"><span>${e(field.label)}</span></label>`));
    }
    wrap.append(control(field, obj, ctx, id));
    if (field.help) wrap.append(el(`<small class="f__help">${e(field.help)}</small>`));
    container.append(wrap);
  }
}

function control(field, obj, ctx, id) {
  const set = (v) => {
    obj[field.key] = v;
    ctx.changed();
  };
  const current = obj[field.key];

  switch (field.type) {
    case 'textarea': {
      const node = el(`<textarea class="textarea" id="${id}" rows="${field.rows || 3}"></textarea>`);
      node.value = current ?? '';
      if (field.max) node.maxLength = field.max;
      node.addEventListener('input', () => set(node.value));
      return node;
    }

    case 'lines': {
      const node = el(`<textarea class="textarea" id="${id}" rows="${Math.min(10, Math.max(3, (current || []).length + 1))}"></textarea>`);
      node.value = (current || []).join('\n');
      node.addEventListener('input', () => set(node.value.split('\n').map((s) => s.trim()).filter(Boolean)));
      return node;
    }

    case 'number': {
      const node = el(`<input class="input" type="number" id="${id}">`);
      node.value = current ?? 0;
      node.addEventListener('input', () => set(Number(node.value)));
      return node;
    }

    case 'toggle': {
      const node = el(`<label class="switch"><input type="checkbox" id="${id}"><span class="switch__track"></span><span>${e(field.label)}</span></label>`);
      const input = node.querySelector('input');
      input.checked = Boolean(current);
      input.addEventListener('change', () => set(input.checked));
      return node;
    }

    case 'select': {
      const node = el(`<select class="select" id="${id}">${field.options.map((o) => `<option value="${e(o.value)}">${e(o.label)}</option>`).join('')}</select>`);
      node.value = current;
      node.addEventListener('change', () => set(node.value));
      return node;
    }

    case 'color': {
      const node = el(`<div class="color-field"><input type="color" id="${id}"><input class="input input--mono" maxlength="7" style="max-width:120px"></div>`);
      const [picker, text] = node.querySelectorAll('input');
      picker.value = text.value = current || '#ff5a1f';
      picker.addEventListener('input', () => {
        text.value = picker.value;
        set(picker.value);
      });
      text.addEventListener('input', () => {
        if (/^#[0-9a-f]{6}$/i.test(text.value)) {
          picker.value = text.value;
          set(text.value.toLowerCase());
        }
      });
      return node;
    }

    case 'stars': {
      const node = el(`<div class="stars-input" role="radiogroup" aria-label="${e(field.label)}"></div>`);
      const draw = () => {
        node.innerHTML = Array.from({ length: field.max || 5 }, (_, i) => `
          <button type="button" class="${i < obj[field.key] ? 'is-on' : ''}" data-n="${i + 1}" aria-label="${i + 1} étoile(s)">${icon('star')}</button>`).join('');
      };
      node.addEventListener('click', (event) => {
        const n = Number(event.target.closest('[data-n]')?.dataset.n);
        if (!n) return;
        set(obj[field.key] === n ? 0 : n);
        draw();
      });
      draw();
      return node;
    }

    case 'icon': {
      const node = el(`<div class="icon-pick" role="radiogroup" aria-label="${e(field.label)}"></div>`);
      const draw = () => {
        node.innerHTML = ICON_CHOICES.map((name) => `
          <button type="button" data-icon="${name}" aria-pressed="${obj[field.key] === name}" title="${name}">${icon(name)}</button>`).join('');
      };
      node.addEventListener('click', (event) => {
        const name = event.target.closest('[data-icon]')?.dataset.icon;
        if (!name) return;
        set(name);
        draw();
      });
      draw();
      return node;
    }

    case 'tags':
      return tagsControl(field, obj, ctx, id);

    case 'multi': {
      const node = el(`<div class="checks" id="${id}"></div>`);
      const draw = () => {
        const options = field.optionsFrom(ctx.root);
        const selected = new Set(obj[field.key] || []);
        node.innerHTML = options.length
          ? options.map((o) => `<label><input type="checkbox" value="${e(o.value)}" ${selected.has(o.value) ? 'checked' : ''}><span>${e(o.label || o.value)}</span></label>`).join('')
          : '<span class="muted" style="font-size:13px">Aucune option : ajoutez-en d’abord.</span>';
      };
      node.addEventListener('change', () => {
        obj[field.key] = [...node.querySelectorAll('input:checked')].map((i) => i.value);
        ctx.changed();
      });
      ctx.refreshers.add(() => {
        if (!node.isConnected) return;
        const known = field.optionsFrom(ctx.root).map((o) => o.value).join('|');
        if (node.dataset.known !== known) {
          node.dataset.known = known;
          draw();
        }
      });
      draw();
      return node;
    }

    case 'image': {
      const node = el(`<div class="image-field">
        <span class="image-field__thumb"></span>
        <input class="input input--mono" id="${id}" placeholder="/uploads/… ou https://…">
        <button class="btn btn--sm" type="button">${icon('image')}Choisir</button>
      </div>`);
      const thumb = node.querySelector('.image-field__thumb');
      const input = node.querySelector('input');
      const show = () => (thumb.style.backgroundImage = input.value ? `url("${input.value.replace(/"/g, '%22')}")` : '');
      input.value = current || '';
      show();
      input.addEventListener('input', () => {
        set(input.value.trim());
        show();
      });
      node.querySelector('button').addEventListener('click', async () => {
        const url = await pickImage();
        if (!url) return;
        input.value = url;
        set(url);
        show();
      });
      return node;
    }

    case 'slug': {
      const node = el(`<input class="input input--mono" id="${id}">`);
      node.value = current || '';
      const placeholder = () => (node.placeholder = slugify(obj[field.from]) || 'auto');
      placeholder();
      ctx.refreshers.add(placeholder);
      node.addEventListener('input', () => set(node.value));
      node.addEventListener('blur', () => {
        node.value = slugify(node.value);
        set(node.value);
      });
      return node;
    }

    case 'group': {
      const node = el('<div class="subfields form-grid"></div>');
      renderFields(node, field.fields, (obj[field.key] ||= {}), ctx);
      return node;
    }

    case 'list':
      return listControl(field, obj, ctx);

    default: {
      const type = field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text';
      const node = el(`<input class="input${type === 'url' ? ' input--mono' : ''}" type="${type}" id="${id}">`);
      node.value = current ?? '';
      if (field.max) node.maxLength = field.max;
      node.addEventListener('input', () => set(node.value));
      return node;
    }
  }
}

function tagsControl(field, obj, ctx, id) {
  const node = el(`<div class="tags"><input id="${id}" placeholder="Ajouter… (Entrée)"></div>`);
  const input = node.querySelector('input');
  const values = () => (obj[field.key] ||= []);

  const draw = () => {
    for (const tag of node.querySelectorAll('.tag')) tag.remove();
    values().forEach((value, i) => {
      input.before(el(`<span class="tag">${e(value)}<button type="button" data-remove="${i}" aria-label="Retirer ${e(value)}">${icon('x')}</button></span>`));
    });
  };
  const add = () => {
    const parts = input.value.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    values().push(...parts);
    input.value = '';
    draw();
    ctx.changed();
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add();
    } else if (event.key === 'Backspace' && !input.value && values().length) {
      values().pop();
      draw();
      ctx.changed();
    }
  });
  input.addEventListener('blur', add);
  node.addEventListener('click', (event) => {
    const i = event.target.closest('[data-remove]')?.dataset.remove;
    if (i === undefined) return input.focus();
    values().splice(Number(i), 1);
    draw();
    ctx.changed();
  });
  draw();
  return node;
}

function listControl(field, obj, ctx) {
  const node = el(`<div class="items" data-key="${e(field.key)}"></div>`);
  const items = () => (obj[field.key] ||= []);
  const labelOf = (item, i) => (field.itemLabel ? field.itemLabel(item) : `${field.label} ${i + 1}`);
  const openSet = new WeakSet();

  const draw = () => {
    node.innerHTML = '';
    items().forEach((item, i) => {
      const details = el(`<details class="item">
        <summary class="item__head">
          <span class="item__chevron">${icon('chevronRight')}</span>
          <span class="item__label"></span>
          <button class="icon-btn" type="button" data-act="up" title="Monter" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>${icon('chevronUp')}</button>
          <button class="icon-btn" type="button" data-act="down" title="Descendre" aria-label="Descendre" ${i === items().length - 1 ? 'disabled' : ''}>${icon('chevronDown')}</button>
          <button class="icon-btn" type="button" data-act="copy" title="Dupliquer" aria-label="Dupliquer">${icon('copy')}</button>
          <button class="icon-btn icon-btn--danger" type="button" data-act="delete" title="Supprimer" aria-label="Supprimer">${icon('trash')}</button>
        </summary>
        <div class="item__body"></div>
      </details>`);
      const label = details.querySelector('.item__label');
      const updateLabel = () => (label.textContent = labelOf(item, items().indexOf(item)));
      updateLabel();
      ctx.refreshers.add(() => details.isConnected && updateLabel());

      // Le contenu n'est construit qu'à l'ouverture : les longues listes restent légères.
      let built = false;
      const build = () => {
        if (built) return;
        built = true;
        const grid = el('<div class="form-grid" style="margin-top:14px"></div>');
        renderFields(grid, field.fields, item, ctx);
        details.querySelector('.item__body').append(grid);
      };
      details.addEventListener('toggle', () => {
        if (details.open) {
          build();
          openSet.add(item);
        } else openSet.delete(item);
      });
      if (openSet.has(item)) {
        details.open = true;
        build();
      }

      details.querySelector('summary').addEventListener('click', (event) => {
        const act = event.target.closest('[data-act]')?.dataset.act;
        if (!act) return;
        event.preventDefault();
        const list = items();
        const index = list.indexOf(item);
        if (act === 'up' && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
        if (act === 'down' && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
        if (act === 'copy') {
          const clone = structuredClone(item);
          if ('id' in clone) clone.id = '';
          list.splice(index + 1, 0, clone);
          openSet.add(clone);
        }
        if (act === 'delete') {
          if (!confirm(`Supprimer « ${labelOf(item, index)} » ?`)) return;
          list.splice(index, 1);
        }
        draw();
        ctx.changed();
      });
      node.append(details);
    });

    const add = el(`<button class="btn btn--sm add" type="button">${icon('plus')}${e(field.addLabel || 'Ajouter')}</button>`);
    add.addEventListener('click', () => addItem());
    if (field.newFirst) node.prepend(add);
    else node.append(add);
  };

  function addItem() {
    const item = emptyItem(field);
    for (const sub of field.fields) if (sub.type === 'date' && !item[sub.key]) item[sub.key] = new Date().toISOString().slice(0, 10);
    if (field.newFirst) items().unshift(item);
    else items().push(item);
    openSet.add(item);
    draw();
    ctx.changed();
    node.querySelector('details[open] input, details[open] textarea')?.focus();
  }

  node.addItem = addItem;
  draw();
  return node;
}
