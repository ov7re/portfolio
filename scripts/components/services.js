/**
 * Section services : les deux pôles et leurs prestations.
 */

import { html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { servicePoles } from '../data/services.js';

function serviceCard(service) {
  return html`
    <article class="card card--hover" data-anim="card">
      <div class="card__icon">${raw(icon(service.icon))}</div>
      <h4 class="card__title">${service.title}</h4>
      <p class="card__text">${service.text}</p>
      <div class="service-card__list">
        ${raw(
          service.items
            .map((item) => html`<span class="service-card__item">${item}</span>`)
            .join('')
        )}
      </div>
    </article>
  `;
}

function pole(data) {
  return html`
    <div class="pole">
      <div class="pole__head" data-anim="fade">
        <h3 class="pole__title"><span>${data.index}</span>${data.title}</h3>
        <p class="pole__desc">${data.description}</p>
      </div>
      <div class="services-grid" data-stagger="60">
        ${raw(data.services.map(serviceCard).join(''))}
      </div>
    </div>
  `;
}

export function mountServices(selector = '[data-services]') {
  render(selector, servicePoles.map(pole).join(''));
}
