/** Paramètres : apparence, accessibilité et informations système. */

import { icon } from '/shared/icons.js';
import { WALLPAPERS } from '/shared/schema.js';
import { escapeHtml as e, formatDate } from '/shared/util.js';
import { getPref, onPrefsChange, resetPrefs, setPref } from '../prefs.js';
import { toast } from '../ui.js';

const ACCENTS = ['#ff5a1f', '#e5343a', '#f5b84b', '#3ecf8e', '#2f8cff', '#8b5cf6', '#ec4899'];

const TABS = [
  { id: 'apparence', label: 'Apparence', icon: 'palette' },
  { id: 'accessibilite', label: 'Accessibilité', icon: 'eye' },
  { id: 'systeme', label: 'Système', icon: 'info' },
];

export default {
  id: 'settings',
  route: 'parametres',
  title: 'Paramètres',
  icon: 'sliders',
  tone: 'slate',
  size: [780, 560],

  render(body, { content, os, params }) {
    const { os: system, identity } = content;
    const accents = [...new Set([system.accent, ...ACCENTS])];
    let tab = TABS.some((t) => t.id === params.sub) ? params.sub : 'apparence';

    body.innerHTML = `
      <div class="settings">
        <nav class="settings__nav" aria-label="Rubriques">
          ${TABS.map((t) => `<button class="side-link" type="button" data-tab="${t.id}">${icon(t.icon)}<span>${t.label}</span></button>`).join('')}
        </nav>
        <div class="settings__main"></div>
      </div>`;
    const main = body.querySelector('.settings__main');

    const panels = {
      apparence: () => `
        <h2 class="h2">Apparence</h2>
        <div class="setting">
          <div><strong>Thème</strong><small>Sombre ou clair, pour tout le système.</small></div>
          <div class="seg">
            <button type="button" data-theme="dark" aria-pressed="${getPref('theme') === 'dark'}">${icon('moon')}Sombre</button>
            <button type="button" data-theme="light" aria-pressed="${getPref('theme') === 'light'}">${icon('sun')}Clair</button>
          </div>
        </div>
        <div class="setting">
          <div><strong>Couleur d’accent</strong><small>Boutons, sélection, détails.</small></div>
          <div class="swatches">
            ${accents.map((c) => `<button class="swatch" type="button" style="--c:${e(c)}" data-accent="${e(c)}" aria-label="Accent ${e(c)}" aria-pressed="${getPref('accent') === c}"></button>`).join('')}
          </div>
        </div>
        <div class="setting" style="display:block">
          <strong>Fond d’écran</strong>
          <div class="walls">
            ${WALLPAPERS.map((w) => `
              <button class="wall" type="button" data-wallpaper-pick="${w.value}" aria-pressed="${getPref('wallpaper') === w.value}">
                <span class="wall__thumb"><span class="wallpaper" data-wallpaper="${w.value}"></span></span>${e(w.label)}
              </button>`).join('')}
          </div>
        </div>`,
      accessibilite: () => `
        <h2 class="h2">Accessibilité</h2>
        <div class="setting">
          <div><strong>Réduire les animations</strong><small>Ouvertures de fenêtres et transitions instantanées.</small></div>
          <label class="switch"><input type="checkbox" data-pref="reduceMotion" ${getPref('reduceMotion') ? 'checked' : ''}><span></span></label>
        </div>
        <div class="setting">
          <div><strong>Revoir le démarrage</strong><small>Rejoue l’écran de démarrage d’${e(system.osName)}.</small></div>
          <button class="btn btn--sm" type="button" data-act="reboot">${icon('refresh')}Redémarrer</button>
        </div>`,
      systeme: () => `
        <h2 class="h2">${e(system.osName)}</h2>
        <dl class="sysinfo section">
          <dt>Version</dt><dd>v${e(os.meta.version)}</dd>
          <dt>Mise à jour</dt><dd>${e(formatDate(os.meta.deployedAt, { dateStyle: 'long', timeStyle: 'short' }))}</dd>
          <dt>Éditeur</dt><dd>${e(identity.name)}</dd>
          <dt>Écran</dt><dd>${innerWidth} × ${innerHeight}</dd>
          <dt>Langue</dt><dd>${e(navigator.language)}</dd>
        </dl>
        <p class="muted section" style="font-size:13px">Conçu et développé sur mesure, sans framework : un serveur Node.js, une API et un logiciel d’administration hébergés sur un NAS.</p>
        <div class="setting section">
          <div><strong>Réinitialiser</strong><small>Rétablit le thème, l’accent et le fond d’écran par défaut.</small></div>
          <button class="btn btn--sm" type="button" data-act="reset">Réinitialiser</button>
        </div>`,
    };

    const show = (id) => {
      tab = id;
      main.innerHTML = panels[id]();
      for (const b of body.querySelectorAll('[data-tab]')) b.setAttribute('aria-current', String(b.dataset.tab === id));
    };

    body.addEventListener('click', (event) => {
      const t = event.target.closest('[data-tab]');
      if (t) return show(t.dataset.tab);
      const theme = event.target.closest('[data-theme]');
      if (theme) return setPref('theme', theme.dataset.theme);
      const accent = event.target.closest('[data-accent]');
      if (accent) return setPref('accent', accent.dataset.accent);
      const wall = event.target.closest('[data-wallpaper-pick]');
      if (wall) return setPref('wallpaper', wall.dataset.wallpaperPick);
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'reboot') os.reboot();
      if (act === 'reset') {
        resetPrefs();
        toast({ title: 'Préférences réinitialisées', iconName: 'refresh' });
      }
    });

    body.addEventListener('change', (event) => {
      if (event.target.dataset.pref) setPref(event.target.dataset.pref, event.target.checked);
    });

    const off = onPrefsChange(() => show(tab));
    show(tab);
    return {
      update: (next) => TABS.some((t) => t.id === next.sub) && show(next.sub),
      destroy: off,
    };
  },
};
