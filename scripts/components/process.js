/**
 * Section méthodologie : de l'idée au produit.
 * Les six étapes forment une piste horizontale que le défilement parcourt
 * sur grand écran (voir lib/motion.js), et une simple colonne sur mobile.
 */

import { html, render } from '../lib/dom.js';
import { processSteps } from '../data/content.js';

export function mountProcess(selector = '[data-process-track]') {
  const markup = processSteps
    .map(
      (step) => html`
        <article class="step" data-step>
          <span class="step__num">${step.num}</span>
          <h3 class="step__title">${step.title}</h3>
          <p class="step__text">${step.text}</p>
        </article>
      `
    )
    .join('');

  render(selector, markup);
}
