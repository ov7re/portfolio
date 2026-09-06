/**
 * Section avis.
 * Uniquement des avis réels : si la liste est vide, la section entière est
 * retirée de la page plutôt que remplie de contenu fictif.
 */

import { qs, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { reviews } from '../data/content.js';

const star = icon('star', { filled: true });

function reviewCard(review) {
  const initial = review.name.trim().charAt(0).toUpperCase();
  const stars =
    review.stars > 0
      ? html`<div class="review__stars" role="img" aria-label="${review.stars} étoiles sur 5">
          ${raw(star.repeat(review.stars))}
        </div>`
      : '';
  const role = review.role ? html`<span class="review__role">${review.role}</span>` : '';

  return html`
    <article class="review" data-anim="card">
      ${raw(stars)}
      <p class="review__text">${review.text}</p>
      <div class="review__author">
        <span class="review__avatar" aria-hidden="true">${initial}</span>
        <span>
          <span class="review__name">${review.name}</span>
          ${raw(role)}
        </span>
      </div>
    </article>
  `;
}

export function mountReviews(selector = '[data-reviews]') {
  const container = qs(selector);
  if (!container) return;

  const section = container.closest('section');
  if (!reviews.length) {
    if (section) section.hidden = true;
    return;
  }

  render(container, reviews.map(reviewCard).join(''));
}
