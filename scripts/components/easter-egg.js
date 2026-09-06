/**
 * Easter egg développeur : un petit terminal, volontairement discret.
 *
 * Deux façons de l'ouvrir : taper « ov7 » au clavier hors champ de saisie,
 * ou cliquer le repère SYSTEM_STATUS du footer. Échap le referme.
 */

import { qs, html, raw, prefersReducedMotion } from '../lib/dom.js';
import { projects } from '../data/projects.js';
import { technologyCount } from '../data/technologies.js';

const SEQUENCE = 'ov7';
const LINE_DELAY = 260;

const script = [
  { type: 'cmd', text: 'whoami' },
  { type: 'out', text: 'OV7 Development' },
  { type: 'cmd', text: 'status' },
  { type: 'out', text: 'ONLINE' },
  { type: 'cmd', text: 'stack --count' },
  { type: 'out', text: `${technologyCount} technologies · ${projects.length} projets` },
  { type: 'dim', text: 'Un projet en tête ? Section contact.' },
];

function createTerminal() {
  const el = document.createElement('aside');
  el.className = 'egg';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Terminal OV7');
  el.innerHTML = html`
    <div class="egg__bar">
      <span>ov7@dev — terminal</span>
      <button type="button" class="egg__close" data-egg-close aria-label="Fermer le terminal">
        ${raw('&#10005;')}
      </button>
    </div>
    <div class="egg__body" data-egg-body></div>
  `;
  document.body.appendChild(el);
  return el;
}

export function mountEasterEgg() {
  let terminal = null;
  let timers = [];
  let isOpen = false;

  const clearTimers = () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers = [];
  };

  const close = () => {
    if (!terminal) return;
    isOpen = false;
    clearTimers();
    terminal.classList.remove('is-open');
  };

  const open = () => {
    if (isOpen) return;
    if (!terminal) {
      terminal = createTerminal();
      terminal.addEventListener('click', (event) => {
        if (event.target.closest('[data-egg-close]')) close();
      });
    }

    isOpen = true;
    const body = qs('[data-egg-body]', terminal);
    body.innerHTML = '';
    terminal.classList.add('is-open');

    const instant = prefersReducedMotion();
    script.forEach((line, index) => {
      const print = () => {
        const node = document.createElement('div');
        node.className = `egg__line egg__line--${line.type}`;
        node.textContent = line.text;
        body.appendChild(node);
        body.scrollTop = body.scrollHeight;
      };
      if (instant) print();
      else timers.push(window.setTimeout(print, index * LINE_DELAY));
    });
  };

  let buffer = '';
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }

    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

    buffer = (buffer + event.key.toLowerCase()).slice(-SEQUENCE.length);
    if (buffer === SEQUENCE) open();
  });

  qs('[data-egg-trigger]')?.addEventListener('click', () => (isOpen ? close() : open()));
}
