/** Services : pôles d'activité et prestations. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { tile } from '../ui.js';

export default {
  id: 'services',
  route: 'services',
  title: 'Services',
  icon: 'briefcase',
  tone: 'ocean',
  size: [900, 640],

  render(body, { content, os }) {
    const { services } = content;
    body.innerHTML = `
      <div class="app">
        <p class="kicker">Prestations</p>
        <h1 class="h1" style="margin-top:8px">Ce que je développe</h1>
        ${services.intro ? `<p class="lead" style="margin-top:8px">${e(services.intro)}</p>` : ''}
        <div class="section">
          ${services.poles.map((pole, i) => `
            <section class="pole">
              <div class="pole__head">
                <span class="pole__index">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h2 class="h2">${e(pole.title)}</h2>
                  ${pole.description ? `<p class="muted" style="margin-top:2px">${e(pole.description)}</p>` : ''}
                </div>
              </div>
              <div class="grid-2">
                ${pole.services.map((s) => `
                  <article class="card service">
                    <div class="service__head">${tile(s.icon, 'ink')}<h3 class="h2">${e(s.title)}</h3></div>
                    <p>${e(s.text)}</p>
                    ${s.items.length ? `<div class="chips">${s.items.map((item) => `<span class="chip">${e(item)}</span>`).join('')}</div>` : ''}
                  </article>`).join('')}
              </div>
            </section>`).join('')}
        </div>
        <div class="cta">
          <div>
            <strong>Votre besoin n’est pas dans la liste ?</strong>
            <p class="muted">Décrivez-le : chaque projet est développé sur mesure.</p>
          </div>
          <div class="widget__actions" style="margin:0">
            <button class="btn" type="button" data-open="projects">${icon('folder')}Voir les projets</button>
            <button class="btn btn--primary" type="button" data-open="contact">${icon('send')}Demander un devis</button>
          </div>
        </div>
      </div>`;

    body.addEventListener('click', (event) => {
      const target = event.target.closest('[data-open]');
      if (target) os.open(target.dataset.open);
    });
  },
};
