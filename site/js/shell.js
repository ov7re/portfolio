/**
 * Le « shell » d'OV7 OS : bureau, barre des tâches, menu démarrer, menu
 * contextuel, widgets et synchronisation fenêtres ↔ adresse de la page.
 *
 * Chaque fenêtre a une adresse (/projets/vaultdesk, /contact…). L'adresse de la
 * page suit la fenêtre au premier plan : un lien partagé rouvre la bonne vue,
 * et le bouton Retour du navigateur ferme la fenêtre ouverte en dernier.
 */

import { icon } from '/shared/icons.js';
import { WALLPAPERS } from '/shared/schema.js';
import { escapeHtml as e, formatDate } from '/shared/util.js';
import { availableApps, PINNED, PINNED_MOBILE } from './apps/index.js';
import { getPref, onPrefsChange, setPref } from './prefs.js';
import { LOGO, el, mountToasts, stars, tile, toast } from './ui.js';
import { createWindowManager } from './wm.js';

export function createShell(root, data, { reboot, shutdown }) {
  const { content } = data;
  const { identity, os: system, projects, reviews } = content;
  const apps = availableApps(content);
  const byId = (id) => apps.find((a) => a.id === id);
  const mobileQuery = matchMedia('(max-width: 760px)');
  const isMobile = () => mobileQuery.matches;

  /* ------------------------------ Structure ------------------------------ */

  root.innerHTML = `
    <div class="statusbar" aria-hidden="true">
      <span data-clock-short></span>
      <span>${e(system.osName)}</span>
      <span><i class="status-dot" data-status="${e(identity.availability)}"></i></span>
    </div>
    <main class="desktop" aria-label="Bureau">
      <div class="wallpaper" aria-hidden="true"><span class="wallpaper__mark">${e(identity.shortName)}</span></div>
      <div class="desktop__scroll">
        <section class="widgets" aria-label="Widgets"></section>
        <nav class="icons" aria-label="Applications"></nav>
      </div>
    </main>
    <div class="windows"></div>
    <footer class="taskbar" aria-label="Barre des tâches">
      <button class="taskbar__start" type="button" aria-label="Menu démarrer" aria-expanded="false" aria-haspopup="dialog">${LOGO}</button>
      <button class="taskbar__search" type="button" data-open-search>${icon('search')}<span>Rechercher</span><kbd>Ctrl K</kbd></button>
      <div class="taskbar__apps"></div>
      <div class="taskbar__tray">
        <button class="tray-btn tray-status" type="button" data-open="contact" title="${e(identity.availabilityLabel)}">
          <i class="status-dot" data-status="${e(identity.availability)}"></i><span>${e(availabilityShort(identity.availability))}</span>
        </button>
        <button class="tray-btn" type="button" data-toggle-theme aria-label="Changer de thème"></button>
        <button class="tray-btn tray-clock" type="button" data-open="settings"><span data-clock></span><span data-date></span></button>
      </div>
    </footer>`;

  if (data.preview) {
    root.append(el(`<div class="preview-banner">${icon('eye')}Aperçu du brouillon — non publié <a href="/api/public/preview/exit">Quitter l’aperçu</a></div>`));
  }
  mountToasts(root);

  const desktop = root.querySelector('.desktop');
  const wallpaper = root.querySelector('.wallpaper');
  const iconsNav = root.querySelector('.icons');
  const widgets = root.querySelector('.widgets');
  const taskApps = root.querySelector('.taskbar__apps');
  const startBtn = root.querySelector('.taskbar__start');
  const themeBtn = root.querySelector('[data-toggle-theme]');

  /* ------------------------------ Fenêtres ------------------------------ */

  let pushNext = false;

  const wm = createWindowManager({
    layer: root.querySelector('.windows'),
    isMobile,
    mount(win, params) {
      return win.app.render(win.body, {
        content,
        params,
        apps,
        os: {
          open: (id, p) => openApp(id, p),
          close: () => wm.close(win),
          navigate(sub) {
            win.path = pathFor(win.app, sub);
            pushNext = true;
            syncUrl();
          },
          setTitle: (title, subtitle) => {
            wm.setTitle(win, title, subtitle);
            win.subtitle = subtitle;
            if (wm.focused === win) syncTitle();
          },
          reboot,
          meta: { version: data.version, deployedAt: data.deployedAt },
        },
      });
    },
    onChange() {
      syncUrl();
      renderTaskbar();
    },
  });

  function pathFor(app, sub) {
    return `/${app.route}${app.subRoutes && sub ? `/${encodeURIComponent(sub)}` : ''}`;
  }

  function openApp(id, params = {}, { push = true } = {}) {
    const app = byId(id);
    if (!app) return null;
    closeMenus();
    pushNext = push;
    return wm.open(app, { params, path: pathFor(app, params.sub) });
  }

  function syncTitle() {
    const win = wm.focused;
    document.title = win ? `${win.subtitle || win.app.title} — ${identity.name}` : `${identity.name} — ${identity.tagline}`;
  }

  function syncUrl() {
    const path = wm.focused?.path || '/';
    if (location.pathname !== path) history[pushNext ? 'pushState' : 'replaceState']({ ov7: true }, '', path);
    pushNext = false;
    syncTitle();
  }

  function openFromPath(pathname, { push = false } = {}) {
    const [route, sub] = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (!route) return true;
    const app = apps.find((a) => a.route === route);
    if (!app) return false;
    openApp(app.id, { sub }, { push });
    return true;
  }

  window.addEventListener('popstate', () => {
    const path = location.pathname;
    if (path === '/') {
      if (isMobile()) wm.closeAll();
      else if (wm.focused) wm.close(wm.focused);
      return;
    }
    const open = wm.list().find((w) => w.path === path);
    if (open) wm.focus(open);
    else if (!openFromPath(path)) history.replaceState({}, '', '/');
  });

  /* ------------------------------ Bureau ------------------------------ */

  function renderIcons() {
    iconsNav.innerHTML = apps.map((app) => `
      <button class="dicon" type="button" data-app="${app.id}">
        ${tile(app.icon, app.tone)}
        <span class="dicon__label">${e(app.title)}</span>
      </button>`).join('');
  }

  iconsNav.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-app]');
    if (!btn) return;
    for (const b of iconsNav.querySelectorAll('.is-selected')) b.classList.remove('is-selected');
    btn.classList.add('is-selected');
    openApp(btn.dataset.app);
  });

  function renderWidgets() {
    const featured = projects.items.filter((p) => p.featured).slice(0, 3);
    const review = reviews.items[0];
    widgets.innerHTML = `
      <article class="widget widget--hello">
        <p class="widget__kicker"><i class="status-dot" data-status="${e(identity.availability)}"></i>${e(identity.availabilityLabel)}</p>
        <h1>${e(system.welcomeTitle || identity.name)}</h1>
        <p>${e(system.welcomeText || identity.tagline)}</p>
        <div class="widget__actions">
          <button class="btn btn--primary btn--sm" type="button" data-open="projects">${icon('folder')}Voir les projets</button>
          <button class="btn btn--sm" type="button" data-open="contact">${icon('send')}Demander un devis</button>
        </div>
      </article>
      <article class="widget widget--clock" aria-hidden="true">
        <span class="clock__time" data-clock></span>
        <span class="clock__date" data-date-long></span>
      </article>
      ${featured.length ? `
        <article class="widget widget--featured">
          <p class="widget__kicker">${icon('star')}À la une</p>
          <div class="featured">
            ${featured.map((p) => `
              <button type="button" data-project="${e(p.id)}">
                ${tile(p.icon, p.tone, 'sm')}
                <span><strong>${e(p.name)}</strong><small>${e(p.status)}</small></span>
              </button>`).join('')}
          </div>
        </article>` : ''}
      ${review ? `
        <article class="widget widget--quote">
          <p class="widget__kicker">${icon('quote')}Avis client</p>
          <blockquote><p>${e(review.text)}</p></blockquote>
          <footer><span>${e(review.name)}</span>${stars(review.rating)}</footer>
        </article>` : ''}`;
  }

  /* ------------------------------ Barre des tâches ------------------------------ */

  function renderTaskbar() {
    const pinned = isMobile() ? PINNED_MOBILE : PINNED;
    const pinnedApps = pinned.map(byId).filter(Boolean);
    const running = wm.list().filter((w) => !pinned.includes(w.app.id)).map((w) => w.app);
    const button = (app, runningOnly = false) => {
      const win = wm.find(app.id);
      const classes = ['tb-app', win && 'is-open', win && wm.focused === win && 'is-active', runningOnly && 'is-running-only'].filter(Boolean).join(' ');
      // Sur ordinateur, une application ouverte affiche aussi son nom.
      const label = win && !isMobile() ? `<span class="tb-app__label">${e(app.title)}</span>` : '';
      return `<button class="${classes}" type="button" data-task="${app.id}" title="${e(app.title)}" aria-label="${e(app.title)}">${tile(app.icon, app.tone)}${label}</button>`;
    };
    taskApps.innerHTML =
      pinnedApps.map((a) => button(a)).join('') +
      (running.length ? `<span class="tb-sep" aria-hidden="true"></span>${running.map((a) => button(a, true)).join('')}` : '');
  }

  taskApps.addEventListener('click', (event) => {
    const id = event.target.closest('[data-task]')?.dataset.task;
    if (!id) return;
    const win = wm.find(id);
    if (!win) return openApp(id);
    if (wm.focused === win && !win.minimized && !isMobile()) wm.minimize(win);
    else {
      pushNext = true;
      wm.focus(win);
    }
  });

  /* ------------------------------ Horloge ------------------------------ */

  function tick() {
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    for (const n of root.querySelectorAll('[data-clock], [data-clock-short]')) n.textContent = time;
    for (const n of root.querySelectorAll('[data-date]')) n.textContent = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    for (const n of root.querySelectorAll('[data-date-long]')) n.textContent = formatDate(now, { weekday: 'long', day: 'numeric', month: 'long' });
  }
  const clockTimer = setInterval(tick, 10_000);

  /* ------------------------------ Apparence ------------------------------ */

  function applyLook() {
    wallpaper.dataset.wallpaper = getPref('wallpaper');
    const dark = getPref('theme') !== 'light';
    themeBtn.innerHTML = icon(dark ? 'moon' : 'sun');
    themeBtn.title = dark ? 'Passer en thème clair' : 'Passer en thème sombre';
  }
  const offPrefs = onPrefsChange(applyLook);

  const toggleTheme = () => setPref('theme', getPref('theme') === 'light' ? 'dark' : 'light');
  const nextWallpaper = () => {
    const i = WALLPAPERS.findIndex((w) => w.value === getPref('wallpaper'));
    setPref('wallpaper', WALLPAPERS[(i + 1) % WALLPAPERS.length].value);
  };
  themeBtn.addEventListener('click', toggleTheme);

  /* ------------------------------ Menus ------------------------------ */

  let start = null;
  let menu = null;

  function closeMenus() {
    start?.remove();
    start = null;
    menu?.remove();
    menu = null;
    startBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleStart(focusSearch = false) {
    if (start) return closeMenus();
    closeMenus();
    start = el(`<div class="popover start" role="dialog" aria-label="Menu démarrer">
      <label class="start__search">${icon('search')}<input type="search" placeholder="Rechercher une app, un projet, une technologie…" aria-label="Rechercher"></label>
      <div class="start__body"></div>
      <div class="start__foot">
        <span class="avatar" style="width:36px;height:36px;border-radius:11px;font-size:13px" aria-hidden="true">${e(identity.shortName)}</span>
        <span class="who"><strong>${e(identity.owner || identity.name)}</strong><small>${e(identity.role)}</small></span>
        <button class="icon-btn" type="button" data-act="settings" title="Paramètres" aria-label="Paramètres">${icon('sliders')}</button>
        <button class="icon-btn" type="button" data-act="shutdown" title="Éteindre" aria-label="Éteindre">${icon('power')}</button>
      </div>
    </div>`);
    root.append(start);
    startBtn.setAttribute('aria-expanded', 'true');

    const body = start.querySelector('.start__body');
    const input = start.querySelector('input');
    let results = [];
    let active = 0;

    const renderHome = () => {
      const featured = projects.items.filter((p) => p.featured).slice(0, 4);
      body.innerHTML = `
        <p class="start__title">Applications</p>
        <div class="start__grid">${apps.map((a) => `<button class="start__app" type="button" data-app="${a.id}">${tile(a.icon, a.tone)}<span>${e(a.title)}</span></button>`).join('')}</div>
        ${featured.length ? `<p class="start__title">Projets à la une</p>
          <div class="results">${featured.map((p) => resultRow({ icon: p.icon, tone: p.tone, title: p.name, sub: p.summary, action: `project:${p.id}` })).join('')}</div>` : ''}`;
    };

    const resultRow = (r, i = -1) => `
      <button class="result${i === active ? ' is-active' : ''}" type="button" data-result="${e(r.action)}">
        ${tile(r.icon, r.tone, 'sm')}<span><strong>${e(r.title)}</strong><small>${e(r.sub || '')}</small></span>${i === active ? '<kbd>Entrée</kbd>' : ''}
      </button>`;

    const search = (q) => {
      const query = q.trim().toLowerCase();
      if (!query) return renderHome();
      const match = (...parts) => parts.join(' ').toLowerCase().includes(query);
      results = [
        ...apps.filter((a) => match(a.title, a.route)).map((a) => ({ icon: a.icon, tone: a.tone, title: a.title, sub: 'Application', action: `app:${a.id}` })),
        ...projects.items.filter((p) => match(p.name, p.summary, p.status, ...p.tech)).map((p) => ({ icon: p.icon, tone: p.tone, title: p.name, sub: p.summary, action: `project:${p.id}` })),
        ...[
          { icon: 'moon', tone: 'ink', title: 'Changer de thème', sub: 'Action', action: 'do:theme', keys: 'theme thème clair sombre dark light' },
          { icon: 'image', tone: 'ink', title: 'Fond d’écran suivant', sub: 'Action', action: 'do:wallpaper', keys: 'fond ecran écran wallpaper' },
        ].filter((a) => match(a.title, a.keys)),
      ].slice(0, 8);
      active = 0;
      body.innerHTML = results.length
        ? `<p class="start__title">Résultats</p><div class="results">${results.map(resultRow).join('')}</div>`
        : `<p class="results__empty">Aucun résultat pour « ${e(q)} ».</p>`;
    };

    const runAction = (action) => {
      const [kind, value] = action.split(':');
      if (kind === 'app') openApp(value);
      if (kind === 'project') openApp('projects', { sub: value });
      if (kind === 'do' && value === 'theme') toggleTheme();
      if (kind === 'do' && value === 'wallpaper') nextWallpaper();
      closeMenus();
    };

    input.addEventListener('input', () => search(input.value));
    input.addEventListener('keydown', (event) => {
      if (!results.length || !input.value) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        active = (active + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
        search(input.value);
      }
      if (event.key === 'Enter') runAction(results[active].action);
    });
    start.addEventListener('click', (event) => {
      const app = event.target.closest('[data-app]');
      if (app) return openApp(app.dataset.app);
      const result = event.target.closest('[data-result]');
      if (result) return runAction(result.dataset.result);
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'settings') openApp('settings');
      if (act === 'shutdown') {
        closeMenus();
        shutdown();
      }
    });

    renderHome();
    if (focusSearch || !isMobile()) setTimeout(() => input.focus(), 30);
  }

  startBtn.addEventListener('click', () => toggleStart());

  function openContextMenu(x, y) {
    closeMenus();
    const dark = getPref('theme') !== 'light';
    menu = el(`<div class="popover menu" role="menu">
      <button type="button" role="menuitem" data-menu="terminal">${icon('terminal')}Ouvrir le terminal</button>
      <button type="button" role="menuitem" data-menu="projects">${icon('folder')}Parcourir les projets</button>
      <hr>
      <button type="button" role="menuitem" data-menu="wallpaper">${icon('image')}Fond d’écran suivant</button>
      <button type="button" role="menuitem" data-menu="theme">${icon(dark ? 'sun' : 'moon')}Thème ${dark ? 'clair' : 'sombre'}</button>
      <button type="button" role="menuitem" data-menu="settings">${icon('sliders')}Paramètres</button>
      <hr>
      <button type="button" role="menuitem" data-menu="about-os">${icon('info')}À propos d’${e(system.osName)}</button>
    </div>`);
    root.append(menu);
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${Math.min(x, innerWidth - width - 8)}px`;
    menu.style.top = `${Math.min(y, innerHeight - height - 8)}px`;
    menu.querySelector('button').focus();
    menu.addEventListener('click', (event) => {
      const action = event.target.closest('[data-menu]')?.dataset.menu;
      closeMenus();
      if (action === 'terminal' || action === 'projects' || action === 'settings') openApp(action);
      if (action === 'wallpaper') nextWallpaper();
      if (action === 'theme') toggleTheme();
      if (action === 'about-os') openApp('settings', { sub: 'systeme' });
    });
  }

  desktop.addEventListener('contextmenu', (event) => {
    if (isMobile() || event.target.closest('.widget, .dicon')) return;
    event.preventDefault();
    openContextMenu(event.clientX, event.clientY);
  });

  desktop.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.dicon')) for (const b of iconsNav.querySelectorAll('.is-selected')) b.classList.remove('is-selected');
  });

  document.addEventListener('pointerdown', (event) => {
    if (start && !start.contains(event.target) && !startBtn.contains(event.target)) closeMenus();
    if (menu && !menu.contains(event.target)) closeMenus();
  });

  /* Raccourcis et liens d'ouverture */
  root.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener && !opener.closest('.win')) openApp(opener.dataset.open);
    const project = event.target.closest('.widget [data-project]');
    if (project) openApp('projects', { sub: project.dataset.project });
    if (event.target.closest('[data-open-search]')) toggleStart(true);
  });

  const onKey = (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if ((event.key === 'k' && (event.ctrlKey || event.metaKey)) || (event.key === '/' && !typing)) {
      event.preventDefault();
      if (!start) toggleStart(true);
      else start.querySelector('input').focus();
    }
    if (event.key === 'Escape' && (start || menu)) closeMenus();
  };
  document.addEventListener('keydown', onKey);

  mobileQuery.addEventListener('change', () => {
    root.classList.toggle('is-mobile', isMobile());
    renderTaskbar();
  });

  /* ------------------------------ Démarrage ------------------------------ */

  root.classList.toggle('is-mobile', isMobile());
  renderIcons();
  renderWidgets();
  renderTaskbar();
  applyLook();
  tick();

  if (!openFromPath(location.pathname)) {
    history.replaceState({}, '', '/');
    toast({ title: 'Page introuvable', text: 'Cette adresse ne correspond à aucune application.', iconName: 'alert', tone: 'slate' });
  }

  return {
    destroy() {
      clearInterval(clockTimer);
      offPrefs();
      document.removeEventListener('keydown', onKey);
      wm.closeAll();
    },
  };
}

function availabilityShort(status) {
  return { open: 'Disponible', limited: 'Places limitées', closed: 'Complet' }[status] || '';
}
