/**
 * Section technologies : une ligne par domaine, les technologies en regard.
 */

import { html, raw, render } from '../lib/dom.js';
import { technologyGroups } from '../data/technologies.js';

export function mountTechnologies(selector = '[data-technologies]') {
  const markup = technologyGroups
    .map(
      (group) => html`
        <div class="tech-group" data-anim="fade">
          <h3 class="tech-group__title">${group.label}</h3>
          <ul class="tech-list">
            ${raw(group.items.map((item) => html`<li>${item.name}</li>`).join(''))}
          </ul>
        </div>
      `
    )
    .join('');

  render(selector, markup);
}
