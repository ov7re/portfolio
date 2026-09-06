/**
 * Section « Pourquoi travailler avec OV7 ? ».
 */

import { html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { advantages } from '../data/content.js';

export function mountAdvantages(selector = '[data-advantages]') {
  const markup = advantages
    .map(
      (item) => html`
        <article class="card card--hover" data-anim="card">
          <div class="card__icon">${raw(icon(item.icon))}</div>
          <h3 class="card__title">${item.title}</h3>
          <p class="card__text">${item.text}</p>
        </article>
      `
    )
    .join('');

  render(selector, markup);
}
