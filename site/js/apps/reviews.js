/** Avis clients. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e, formatDate, paragraphs, plural } from '/shared/util.js';
import { initials, stars } from '../ui.js';

export default {
  id: 'reviews',
  route: 'avis',
  title: 'Avis clients',
  icon: 'star',
  tone: 'emerald',
  size: [720, 620],

  render(body, { content, os }) {
    const reviews = content.reviews.items;
    const rated = reviews.filter((r) => r.rating > 0);
    const average = rated.length ? rated.reduce((n, r) => n + r.rating, 0) / rated.length : 0;

    body.innerHTML = `
      <div class="app">
        <p class="kicker">Témoignages</p>
        <h1 class="h1" style="margin-top:8px">Ils m’ont fait confiance</h1>
        ${reviews.length ? `
          ${rated.length ? `
            <div class="rating section">
              <span class="rating__score">${average.toFixed(1).replace('.', ',')}</span>
              <div>
                ${stars(Math.round(average))}
                <p class="muted" style="margin-top:4px">Moyenne sur ${plural(rated.length, 'avis', 'avis')}</p>
              </div>
            </div>` : ''}
          <div class="reviews">
            ${reviews.map((r) => `
              <article class="card review">
                <span class="review__quote" aria-hidden="true">${icon('quote')}</span>
                ${stars(r.rating)}
                <div class="prose review__text">${paragraphs(r.text)}</div>
                <footer class="review__who">
                  <span class="avatar" aria-hidden="true">${e(initials(r.name))}</span>
                  <div>
                    <strong>${e(r.name)}</strong>
                    <small>${[r.role, r.project, formatDate(r.date, { month: 'long', year: 'numeric' })].filter(Boolean).map(e).join(' · ')}</small>
                  </div>
                </footer>
              </article>`).join('')}
          </div>`
        : `<div class="empty">${icon('star')}<p>Aucun avis publié pour le moment.</p></div>`}
        <div class="cta">
          <div><strong>Vous aussi, lancez votre projet.</strong></div>
          <button class="btn btn--primary" type="button" data-open="contact">${icon('send')}Demander un devis</button>
        </div>
      </div>`;

    body.querySelector('[data-open]').addEventListener('click', () => os.open('contact'));
  },
};
