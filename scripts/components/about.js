/**
 * Section à propos : domaines couverts et fiche studio.
 * Le texte de présentation reste dans le HTML (référencement et lisibilité
 * sans JavaScript) ; seules les listes viennent des données.
 */

import { html, render } from '../lib/dom.js';
import { about } from '../data/content.js';

export function mountAbout({ pills = '[data-about-pills]', specs = '[data-about-specs]' } = {}) {
  render(
    pills,
    about.pills.map((pill) => html`<span class="about__pill" data-anim="fade">${pill}</span>`).join('')
  );

  render(
    specs,
    about.specs
      .map(
        (row) => html`
          <div class="spec-row">
            <span class="spec-row__k">${row.key}</span>
            <span class="spec-row__v">${row.value}</span>
          </div>
        `
      )
      .join('')
  );
}
