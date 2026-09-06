/**
 * Relevé de données du hero.
 * Les valeurs viennent de scripts/data/content.js, où elles sont calculées
 * à partir des données réelles du site. Une valeur numérique est comptée à
 * l'écran ; une valeur textuelle est simplement affichée.
 */

import { html, raw, render } from '../lib/dom.js';
import { stats } from '../data/content.js';

/**
 * La valeur réelle est écrite directement : si le compteur animé ne démarre
 * pas (GSAP bloqué, mouvement réduit), le visiteur lit le bon chiffre.
 */
function statValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? html`<b data-count="${numeric}">${numeric}</b>`
    : html`<b>${value}</b>`;
}

export function mountStats(selector = '[data-stats]') {
  const markup = stats
    .map(
      (stat, index) => html`
        <span class="readout__line">
          ${raw(index === 0 ? '<span class="readout__dot" aria-hidden="true"></span>' : '')}
          ${raw(statValue(stat.value))} ${stat.label}
        </span>
      `
    )
    .join('');

  render(selector, markup);
}
