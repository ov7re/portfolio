/**
 * OV7 Studio — point d'entrée du logiciel d'administration.
 * Connexion, coque (navigation latérale + barre du haut) et routage par #.
 */

import { icon } from '/shared/icons.js';
import { SECTIONS } from '/shared/schema.js';
import { escapeHtml as e } from '/shared/util.js';
import { get, onUnauthorized, post } from './api.js';
import { refreshContent, refreshCounters, store, subscribe, update } from './store.js';
import { LOGO, el, toastError } from './ui.js';
import * as account from './views/account.js';
import * as content from './views/content.js';
import * as dashboard from './views/dashboard.js';
import * as deploy from './views/deploy.js';
import * as maintenance from './views/maintenance.js';
import * as media from './views/media.js';
import * as messages from './views/messages.js';
import * as updates from './views/updates.js';

const app = document.getElementById('app');

/** Sections mises en avant en tête du menu Contenu. */
const PRIMARY = ['projects', 'reviews'];

const ROUTES = [
  { pattern: /^$/, view: dashboard },
  { pattern: /^contenu\/(?<key>[\w-]+)$/, view: content },
  { pattern: /^messages$/, view: messages },
  { pattern: /^medias$/, view: media },
  { pattern: /^deploiement$/, view: deploy },
  { pattern: /^maintenance$/, view: maintenance },
  { pattern: /^mises-a-jour$/, view: updates },
  { pattern: /^compte$/, view: account },
  { pattern: /^journal$/, view: { render: account.renderActivity, title: () => 'Journal' } },
];

/* ------------------------------ Connexion ------------------------------ */

function renderLogin(message = '') {
  app.innerHTML = `
    <main class="login">
      <div class="login__card">
        <div class="login__logo">${LOGO}</div>
        <h1>OV7 Studio</h1>
        <p>Logiciel d’administration d’OV7 OS.</p>
        <form novalidate>
          <label class="f"><span class="f__label">Identifiant</span><input class="input" name="username" autocomplete="username" required></label>
          <label class="f"><span class="f__label">Mot de passe</span><input class="input" name="password" type="password" autocomplete="current-password" required></label>
          <p class="login__error" role="alert">${e(message)}</p>
          <button class="btn btn--primary" type="submit">Se connecter</button>
        </form>
      </div>
    </main>`;
  const form = app.querySelector('form');
  form.elements.username.focus();
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.classList.add('is-busy');
    try {
      await post('/login', { username: form.elements.username.value, password: form.elements.password.value });
      await boot();
    } catch (error) {
      button.classList.remove('is-busy');
      form.querySelector('.login__error').textContent = error.message;
      form.elements.password.select();
    }
  });
}

/* ------------------------------ Coque ------------------------------ */

let currentView = null;
let shellReady = false;

function renderShell() {
  const sectionLink = (s) => `<a href="#/contenu/${s.key}" data-section="${s.key}">${icon(s.icon)}<span>${e(s.label)}</span></a>`;
  const primary = PRIMARY.map((k) => SECTIONS.find((s) => s.key === k));
  const others = SECTIONS.filter((s) => !PRIMARY.includes(s.key));

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">${LOGO}<div><strong>OV7 Studio</strong><small data-version></small></div></div>
        <nav class="nav" aria-label="Navigation">
          <a href="#/">${icon('home')}<span>Tableau de bord</span></a>
          <p class="nav__title">Contenu</p>
          ${primary.map(sectionLink).join('')}
          <p class="nav__title">Sections du site</p>
          ${others.map(sectionLink).join('')}
          <p class="nav__title">Exploitation</p>
          <a href="#/messages">${icon('inbox')}<span>Messages</span><span class="badge" data-unread hidden></span></a>
          <a href="#/medias">${icon('image')}<span>Médias</span></a>
          <a href="#/deploiement">${icon('cloud')}<span>Déploiement</span><span class="badge" data-pending hidden></span></a>
          <a href="#/maintenance">${icon('wrench')}<span>Maintenance</span><span class="dot" data-maint hidden></span></a>
          <a href="#/mises-a-jour">${icon('refresh')}<span>Mises à jour</span></a>
          <p class="nav__title">Système</p>
          <a href="#/journal">${icon('history')}<span>Journal</span></a>
          <a href="#/compte">${icon('user')}<span>Compte</span></a>
        </nav>
        <div class="sidebar__foot">
          <div class="who">${e(store.session.username)}<small>Administrateur</small></div>
          <button class="icon-btn" type="button" data-logout title="Se déconnecter" aria-label="Se déconnecter">${icon('logout')}</button>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn topbar__menu" type="button" data-menu aria-label="Menu">${icon('menu')}</button>
          <div class="topbar__title" data-title></div>
          <a class="btn btn--sm btn--ghost" href="${e(store.session.siteUrl)}" target="_blank" rel="noopener">${icon('external')}<span>Voir le site</span></a>
          <button class="btn btn--sm" type="button" data-preview>${icon('eye')}<span>Prévisualiser</span></button>
          <a class="btn btn--sm btn--primary" href="#/deploiement" data-deploy>${icon('cloud')}<span>Déployer</span></a>
        </header>
        <main class="view" id="view" tabindex="-1"></main>
      </div>
    </div>`;

  const shell = app.querySelector('.shell');
  app.querySelector('[data-logout]').addEventListener('click', async () => {
    await post('/logout').catch(() => {});
    location.hash = '';
    renderLogin();
    shellReady = false;
  });
  app.querySelector('[data-preview]').addEventListener('click', openPreview);
  app.querySelector('[data-menu]').addEventListener('click', () => {
    shell.classList.add('is-nav-open');
    const scrim = el('<div class="scrim"></div>');
    scrim.addEventListener('click', () => {
      shell.classList.remove('is-nav-open');
      scrim.remove();
    });
    shell.append(scrim);
  });
  app.querySelector('.nav').addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      shell.classList.remove('is-nav-open');
      shell.querySelector('.scrim')?.remove();
    }
  });

  subscribe(paintCounters);
  paintCounters();
  shellReady = true;
}

function paintCounters() {
  if (!shellReady && !app.querySelector('.shell')) return;
  const unread = app.querySelector('[data-unread]');
  const pending = app.querySelector('[data-pending]');
  if (!unread) return;
  unread.hidden = !store.unread;
  unread.textContent = store.unread;
  pending.hidden = !store.pending.length;
  pending.textContent = store.pending.length;
  app.querySelector('[data-maint]').hidden = !store.maintenance;
  app.querySelector('[data-version]').textContent = store.release ? `site en v${store.release.version}` : '';
  for (const link of app.querySelectorAll('[data-section]')) {
    link.querySelector('.dot')?.remove();
    if (store.pending.includes(link.dataset.section)) link.append(el('<span class="dot" title="Modifié, non déployé"></span>'));
  }
  const deployBtn = app.querySelector('[data-deploy]');
  deployBtn.classList.toggle('btn--primary', store.pending.length > 0);
  deployBtn.querySelector('span').textContent = store.pending.length ? `Déployer (${store.pending.length})` : 'Déployer';
}

async function openPreview() {
  // La fenêtre est ouverte tout de suite (sinon le navigateur la bloque), puis dirigée vers l'aperçu.
  const win = window.open('about:blank', '_blank');
  try {
    const { url } = await post('/preview');
    if (win) win.location = url;
    else location.href = url;
  } catch (error) {
    win?.close();
    toastError(error);
  }
}

/* ------------------------------ Routage ------------------------------ */

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, search = ''] = raw.split('?');
  return { path, query: new URLSearchParams(search) };
}

let lastHash = location.hash;

async function route() {
  if (!shellReady) return;
  const { path, query } = parseHash();

  if (currentView?.canLeave && location.hash !== lastHash) {
    const ok = await currentView.canLeave();
    if (!ok) {
      history.replaceState(null, '', lastHash || '#/');
      return;
    }
  }
  currentView?.destroy?.();
  currentView = null;
  lastHash = location.hash;

  const match = ROUTES.map((r) => ({ r, m: path.match(r.pattern) })).find((x) => x.m);
  const view = document.getElementById('view');
  for (const a of app.querySelectorAll('.nav a')) {
    const href = a.getAttribute('href').slice(2);
    a.toggleAttribute('aria-current', href === path);
    if (href === path) a.setAttribute('aria-current', 'page');
  }

  if (!match) {
    view.innerHTML = `<div class="empty">${icon('alert')}<p>Page introuvable.</p><a class="btn" href="#/">Tableau de bord</a></div>`;
    return;
  }

  const params = match.m.groups || {};
  const titleText = match.r.view.title?.(params) || '';
  app.querySelector('[data-title]').innerHTML = e(titleText);
  document.title = `${titleText} — OV7 Studio`;
  view.innerHTML = '<div class="loading"><span class="spin"></span></div>';
  view.scrollTop = 0;
  window.scrollTo(0, 0);

  try {
    currentView = await match.r.view.render(view, {
      params,
      query,
      openPreview,
      rerender: () => {
        lastHash = '';
        route();
      },
    });
  } catch (error) {
    if (error.status === 401) return;
    view.innerHTML = `<div class="notice notice--danger">${icon('alert')}<div><strong>Chargement impossible.</strong> ${e(error.message)}</div></div>`;
  }
}

window.addEventListener('hashchange', route);

/* ------------------------------ Démarrage ------------------------------ */

onUnauthorized(() => {
  shellReady = false;
  currentView = null;
  renderLogin('Session expirée : reconnectez-vous.');
});

async function boot() {
  try {
    const session = await get('/session');
    update({ session });
  } catch (error) {
    if (error.status === 401) return renderLogin();
    app.innerHTML = `<div class="login"><div class="login__card"><div class="login__logo">${LOGO}</div><h1>Serveur injoignable</h1><p>${e(error.message)}</p></div></div>`;
    return;
  }
  await Promise.all([refreshContent(), refreshCounters()]);
  renderShell();
  lastHash = location.hash;
  await route();
}

boot().catch(toastError);
