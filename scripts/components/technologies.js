/**
 * Section technologies : cartes sobres regroupées par domaine.
 */

import { html, raw, render } from '../lib/dom.js';
import { technologyGroups } from '../data/technologies.js';

function techCard(item, groupLabel) {
  return html`
    <div class="tech" data-anim="card">
      <span class="tech__mark" aria-hidden="true">${item.mark}</span>
      <span class="tech__text">
        <span class="tech__name">${item.name}</span>
        <span class="tech__cat">${groupLabel}</span>
      </span>
    </div>
  `;
}

export function mountTechnologies(selector = '[data-technologies]') {
  const markup = technologyGroups
    .map(
      (group) => html`
        <div class="tech-group">
          <div class="tech-group__head" data-anim="fade">
            <h3 class="tech-group__title">${group.label}</h3>
            <span class="tech-group__line" aria-hidden="true"></span>
          </div>
          <div class="tech-grid" data-stagger="40">
            ${raw(group.items.map((item) => techCard(item, group.label)).join(''))}
          </div>
        </div>
      `
    )
    .join('');

  render(selector, markup);
}
