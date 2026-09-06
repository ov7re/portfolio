/**
 * Bandeau de statistiques.
 * Les valeurs viennent de scripts/data/content.js, où elles sont calculées
 * à partir des données réelles du site. Une valeur numérique est comptée à
 * l'écran ; une valeur textuelle est simplement affichée.
 */

import { html, raw, render } from '../lib/dom.js';
import { stats } from '../data/content.js';

function statValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? html`<span data-count="${numeric}">0</span>`
    : html`${value}`;
}

export function mountStats(selector = '[data-stats]') {
  const markup = stats
    .map(
      (stat) => html`
        <div class="stat" data-anim="fade">
          <div class="stat__value">${raw(statValue(stat.value))}</div>
          <div class="stat__label">${stat.label}</div>
        </div>
      `
    )
    .join('');

  render(selector, markup);
}
