/**
 * Section méthodologie : les six étapes, en liste numérotée.
 */

import { html, render } from '../lib/dom.js';
import { processSteps } from '../data/content.js';

export function mountProcess(selector = '[data-process]') {
  const markup = processSteps
    .map(
      (step) => html`
        <article class="step" data-anim="fade">
          <span class="step__num">${step.num}</span>
          <h3 class="step__title">${step.title}</h3>
          <p class="step__text">${step.text}</p>
        </article>
      `
    )
    .join('');

  render(selector, markup);
}
