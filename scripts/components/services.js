/**
 * Section services : les deux pôles et leurs prestations.
 * Présentation en colonnes plutôt qu'en cartes — le décor 3D reste visible
 * derrière le texte.
 */

import { html, raw, render } from '../lib/dom.js';
import { servicePoles } from '../data/services.js';

function offer(service) {
  return html`
    <div class="offer">
      <div class="offer__head">
        <span class="offer__name">${service.title}</span>
      </div>
      <p class="offer__text">${service.text}</p>
      <div class="offer__items">
        ${raw(service.items.map((item) => html`<span>${item}</span>`).join(''))}
      </div>
    </div>
  `;
}

function pole(data) {
  return html`
    <div class="pole" data-anim="fade">
      <div class="pole__head">
        <span class="pole__num">${data.index}</span>
        <h3 class="pole__title">${data.title}</h3>
        <p class="pole__desc">${data.description}</p>
      </div>
      <div class="pole__offers">
        ${raw(data.services.map(offer).join(''))}
      </div>
    </div>
  `;
}

export function mountServices(selector = '[data-services]') {
  render(selector, servicePoles.map(pole).join(''));
}
