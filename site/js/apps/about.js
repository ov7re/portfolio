/** À propos : présentation, méthode de travail et points forts. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e, paragraphs } from '/shared/util.js';
import { tile } from '../ui.js';

const TABS = [
  { id: 'presentation', label: 'Présentation' },
  { id: 'methode', label: 'Méthode' },
  { id: 'atouts', label: 'Points forts' },
];

export default {
  id: 'about',
  route: 'a-propos',
  title: 'À propos',
  icon: 'user',
  tone: 'ember',
  size: [820, 620],

  render(body, { content, os, params }) {
    const { identity, about, process } = content;
    let current = TABS.some((t) => t.id === params.sub) ? params.sub : 'presentation';

    const availability = identity.availabilityLabel
      ? `<span><i class="status-dot" data-status="${e(identity.availability)}"></i>${e(identity.availabilityLabel)}</span>`
      : '';

    const panels = {
      presentation: () => `
        <div class="about-grid">
          <div>
            <h2 class="h2">${e(about.headline)}</h2>
            <div class="prose" style="margin-top:12px">${paragraphs(about.intro)}</div>
            ${about.pills.length ? `<div class="chips" style="margin-top:18px">${about.pills.map((p) => `<span class="chip chip--accent">${e(p)}</span>`).join('')}</div>` : ''}
          </div>
          ${about.specs.length ? `
          <aside class="card">
            <p class="kicker" style="margin-bottom:6px">Fiche studio</p>
            <dl class="specs">${about.specs.map((s) => `<div><dt>${e(s.key)}</dt><dd>${e(s.value)}</dd></div>`).join('')}</dl>
          </aside>` : ''}
        </div>`,
      methode: () => `
        <div class="section">
          ${process.intro ? `<p class="lead">${e(process.intro)}</p>` : ''}
          <ol class="steps" style="margin-top:18px">
            ${process.steps.map((s, i) => `
              <li class="step">
                <span class="step__num">${String(i + 1).padStart(2, '0')}</span>
                <div><h3>${e(s.title)}</h3><p>${e(s.text)}</p></div>
              </li>`).join('')}
          </ol>
        </div>`,
      atouts: () => `
        <div class="grid-2 section">
          ${about.advantages.map((a) => `
            <div class="card adv">
              ${tile(a.icon, 'ink')}
              <div><h3>${e(a.title)}</h3><p>${e(a.text)}</p></div>
            </div>`).join('')}
        </div>`,
    };

    body.innerHTML = `
      <div class="app">
        <header class="profile">
          <div class="avatar" aria-hidden="true">${e(identity.shortName)}</div>
          <div>
            <h1 class="h1">${e(identity.owner || identity.name)}</h1>
            <div class="profile__meta">
              <span>${icon('briefcase')}${e(identity.role)}</span>
              ${identity.location ? `<span>${icon('globe')}${e(identity.location)}</span>` : ''}
              ${availability}
            </div>
          </div>
        </header>
        <div class="tabs" role="tablist" style="margin-top:24px">
          ${TABS.map((t) => `<button type="button" role="tab" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div class="about-panel" role="tabpanel"></div>
        <div class="cta">
          <div>
            <strong>Un projet en tête ?</strong>
            <p class="muted">${e(identity.responseTime)}</p>
          </div>
          <button class="btn btn--primary" type="button" data-open="contact">${icon('mail')}Me contacter</button>
        </div>
      </div>`;

    const panel = body.querySelector('.about-panel');
    const show = (id) => {
      current = id;
      panel.innerHTML = panels[id]();
      for (const b of body.querySelectorAll('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === id));
    };

    body.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (tab) show(tab.dataset.tab);
      if (event.target.closest('[data-open="contact"]')) os.open('contact');
    });

    show(current);
    return {
      update(next) {
        if (TABS.some((t) => t.id === next.sub)) show(next.sub);
      },
    };
  },
};
