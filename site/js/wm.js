/**
 * Gestionnaire de fenêtres d'OV7 OS.
 *
 * Une application = une fenêtre au plus (rouvrir l'application ramène sa
 * fenêtre au premier plan). Les fenêtres se déplacent, se redimensionnent,
 * s'agrandissent (double-clic ou glisser en haut de l'écran) et s'ancrent à
 * gauche ou à droite en les glissant contre un bord.
 * Sur mobile, chaque fenêtre occupe tout l'écran, comme une application.
 */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { el, tile } from './ui.js';

const MIN_W = 340;
const MIN_H = 240;
const EDGE = 6;
const GRIPS = ['e', 'w', 's', 'se', 'sw'];

let uid = 0;

export function createWindowManager({ layer, isMobile, mount, onChange }) {
  const wins = [];
  let zTop = 10;
  let cascade = 0;
  let focused = null;

  const ghost = el('<div class="snap-ghost" hidden></div>');
  layer.append(ghost);

  const area = () => layer.getBoundingClientRect();
  const clamp = (v, min, max) => Math.min(Math.max(v, min), Math.max(min, max));
  const changed = () => onChange?.(focused);

  /* ------------------------------ Géométrie ------------------------------ */

  function initialRect(app) {
    const b = area();
    const [dw, dh] = app.size || [760, 540];
    const w = Math.min(dw, b.width - 32);
    const h = Math.min(dh, b.height - 32);
    const offset = (cascade++ % 6) * 26;
    const x = clamp((b.width - w) / 2 - 60 + offset, 16, b.width - w - 16);
    const y = clamp((b.height - h) / 2 - 30 + offset, 12, b.height - h - 12);
    return { x, y, w, h };
  }

  function applyRect(win) {
    const { x, y, w, h } = win.rect;
    Object.assign(win.node.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
  }

  function setMode(win, mode, animate = true) {
    if (animate) {
      win.node.classList.add('is-animating');
      setTimeout(() => win.node.classList.remove('is-animating'), 260);
    }
    win.mode = mode;
    win.node.classList.toggle('is-max', mode === 'max');
    win.node.classList.toggle('is-snap-left', mode === 'left');
    win.node.classList.toggle('is-snap-right', mode === 'right');
    const maxBtn = win.node.querySelector('[data-act="max"]');
    maxBtn.innerHTML = icon(mode ? 'restore' : 'square');
    maxBtn.setAttribute('aria-label', mode ? 'Restaurer' : 'Agrandir');
    maxBtn.title = mode ? 'Restaurer' : 'Agrandir';
  }

  /* ------------------------------ Cycle de vie ------------------------------ */

  function open(app, { params = {}, path } = {}) {
    let win = wins.find((w) => w.app.id === app.id);
    if (win) {
      if (win.minimized) restore(win);
      if (path) win.path = path;
      win.instance?.update?.(params);
      focus(win);
      return win;
    }

    const id = `win-${++uid}`;
    const node = el(`<section class="win" role="dialog" aria-labelledby="${id}-t" data-app="${e(app.id)}">
      <header class="win__bar">
        <button class="win__back" type="button" data-act="close" aria-label="Retour à l’accueil">${icon('arrowLeft')}</button>
        ${tile(app.icon, app.tone, 'xs')}
        <h2 class="win__title" id="${id}-t">${e(app.title)}</h2>
        <div class="win__ctrl">
          <button type="button" data-act="min" aria-label="Réduire" title="Réduire">${icon('minus')}</button>
          <button type="button" data-act="max" aria-label="Agrandir" title="Agrandir">${icon('square')}</button>
          <button type="button" data-act="close" aria-label="Fermer" title="Fermer">${icon('x')}</button>
        </div>
      </header>
      <div class="win__body"></div>
      ${GRIPS.map((d) => `<div class="win__grip" data-dir="${d}" aria-hidden="true"></div>`).join('')}
    </section>`);

    win = {
      id,
      app,
      node,
      body: node.querySelector('.win__body'),
      path: path || app.path,
      rect: initialRect(app),
      mode: null,
      minimized: false,
      instance: null,
    };
    wins.push(win);
    layer.append(node);
    applyRect(win);
    if (app.maximized && area().width < 1100) setMode(win, 'max', false);
    bind(win);
    focus(win);
    win.instance = mount(win, params) || {};
    return win;
  }

  function focus(win) {
    if (!win) return;
    if (win.minimized) restore(win);
    win.node.style.zIndex = String(++zTop);
    for (const w of wins) w.node.classList.toggle('is-focused', w === win);
    focused = win;
    changed();
  }

  function focusTopmost() {
    const visible = wins.filter((w) => !w.minimized);
    const top = visible.sort((a, b) => Number(b.node.style.zIndex) - Number(a.node.style.zIndex))[0];
    if (top) focus(top);
    else {
      focused = null;
      for (const w of wins) w.node.classList.remove('is-focused');
      changed();
    }
  }

  function minimize(win) {
    if (isMobile()) return close(win);
    win.minimized = true;
    win.node.classList.add('is-minimizing');
    const done = () => {
      win.node.classList.remove('is-minimizing');
      if (win.minimized) win.node.classList.add('is-minimized');
    };
    win.node.addEventListener('animationend', done, { once: true });
    setTimeout(done, 320);
    if (focused === win) focusTopmost();
    else changed();
  }

  function restore(win) {
    win.minimized = false;
    win.node.classList.remove('is-minimized', 'is-minimizing');
  }

  function close(win) {
    if (!win || !wins.includes(win)) return;
    wins.splice(wins.indexOf(win), 1);
    win.instance?.destroy?.();
    win.node.classList.add('is-closing');
    const remove = () => win.node.remove();
    win.node.addEventListener('animationend', remove, { once: true });
    setTimeout(remove, 300);
    if (focused === win) focusTopmost();
    else changed();
  }

  function toggleMax(win) {
    setMode(win, win.mode ? null : 'max');
  }

  /* ------------------------------ Interactions ------------------------------ */

  function bind(win) {
    const { node } = win;
    const bar = node.querySelector('.win__bar');

    node.addEventListener('pointerdown', () => focused !== win && focus(win), true);

    node.querySelector('.win__ctrl').addEventListener('click', (event) => {
      const act = event.target.closest('button')?.dataset.act;
      if (act === 'min') minimize(win);
      if (act === 'max') toggleMax(win);
      if (act === 'close') close(win);
    });
    node.querySelector('.win__back').addEventListener('click', () => close(win));

    bar.addEventListener('dblclick', (event) => {
      if (!event.target.closest('button') && !isMobile()) toggleMax(win);
    });

    bar.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button') || isMobile()) return;
      startDrag(win, event, bar);
    });

    for (const grip of node.querySelectorAll('.win__grip')) {
      grip.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || isMobile()) return;
        startResize(win, event, grip);
      });
    }
  }

  function track(target, event, onMove, onUp) {
    event.preventDefault();
    target.setPointerCapture(event.pointerId);
    document.body.classList.add('dragging');
    const move = (e) => onMove(e);
    const up = (e) => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      document.body.classList.remove('dragging');
      onUp?.(e);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  }

  function startDrag(win, event, bar) {
    const start = { px: event.clientX, py: event.clientY, x: win.rect.x, y: win.rect.y };
    let moved = false;
    let snap = null;

    track(bar, event, (e) => {
      const dx = e.clientX - start.px;
      const dy = e.clientY - start.py;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 5) return;
      const b = area();

      if (!moved && win.mode) {
        // Décrocher une fenêtre agrandie : le curseur garde sa position relative.
        const shown = win.node.getBoundingClientRect();
        const ratio = (start.px - shown.left) / shown.width;
        setMode(win, null, false);
        start.x = start.px - b.left - ratio * win.rect.w;
        start.y = 0;
      }
      moved = true;

      win.rect.x = clamp(start.x + dx, -win.rect.w + 120, b.width - 120);
      win.rect.y = clamp(start.y + dy, 0, b.height - 46);
      applyRect(win);

      snap = e.clientY <= b.top + EDGE ? 'max' : e.clientX <= b.left + EDGE ? 'left' : e.clientX >= b.right - EDGE ? 'right' : null;
      showGhost(snap);
    }, () => {
      showGhost(null);
      if (snap) setMode(win, snap);
    });
  }

  function showGhost(mode) {
    if (!mode) {
      ghost.hidden = true;
      return;
    }
    const b = area();
    const rect = mode === 'max' ? [8, 8, b.width - 16, b.height - 16]
      : mode === 'left' ? [8, 8, b.width / 2 - 12, b.height - 16]
      : [b.width / 2 + 4, 8, b.width / 2 - 12, b.height - 16];
    Object.assign(ghost.style, { left: `${rect[0]}px`, top: `${rect[1]}px`, width: `${rect[2]}px`, height: `${rect[3]}px`, zIndex: zTop + 1 });
    ghost.hidden = false;
  }

  function startResize(win, event, grip) {
    const dir = grip.dataset.dir;
    const start = { px: event.clientX, py: event.clientY, ...win.rect };
    const [minW, minH] = win.app.minSize || [MIN_W, MIN_H];

    track(grip, event, (e) => {
      const b = area();
      const dx = e.clientX - start.px;
      const dy = e.clientY - start.py;
      if (dir.includes('e')) win.rect.w = clamp(start.w + dx, minW, b.width - start.x);
      if (dir.includes('s')) win.rect.h = clamp(start.h + dy, minH, b.height - start.y);
      if (dir.includes('w')) {
        const w = clamp(start.w - dx, minW, start.x + start.w);
        win.rect.x = start.x + start.w - w;
        win.rect.w = w;
      }
      applyRect(win);
    });
  }

  /** Garde les fenêtres atteignables quand la fenêtre du navigateur rétrécit. */
  window.addEventListener('resize', () => {
    const b = area();
    for (const win of wins) {
      win.rect.w = Math.min(win.rect.w, b.width - 16);
      win.rect.h = Math.min(win.rect.h, b.height - 16);
      win.rect.x = clamp(win.rect.x, 0, b.width - win.rect.w);
      win.rect.y = clamp(win.rect.y, 0, b.height - 46);
      applyRect(win);
    }
  });

  return {
    open,
    close,
    focus,
    minimize,
    restore,
    toggleMax,
    closeAll: () => [...wins].forEach(close),
    find: (appId) => wins.find((w) => w.app.id === appId) || null,
    list: () => [...wins],
    get focused() {
      return focused;
    },
    setTitle(win, title, subtitle = '') {
      win.node.querySelector('.win__title').innerHTML = `${e(title)}${subtitle ? `<small>${e(subtitle)}</small>` : ''}`;
    },
  };
}
