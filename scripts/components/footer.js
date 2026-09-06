/**
 * Footer : liens externes réels et année courante.
 */

import { qs, html, raw, render } from '../lib/dom.js';
import { icon } from '../lib/icons.js';
import { socialLinks, site } from '../data/site.js';

export function mountFooter({
  social = '[data-footer-social]',
  year = '[data-year]',
} = {}) {
  const socialEl = qs(social);
  if (socialEl) {
    if (!socialLinks.length) {
      socialEl.closest('.footer__col')?.remove();
    } else {
      render(
        socialEl,
        socialLinks
          .map(
            (link) => html`
              <li>
                <a href="${link.href}" target="_blank" rel="noopener noreferrer">
                  ${link.label} ${raw(icon('arrowUpRight'))}
                </a>
              </li>
            `
          )
          .join('')
      );
      socialEl.querySelectorAll('svg').forEach((svg) => svg.classList.add('footer__link-icon'));
    }
  }

  const yearEl = qs(year);
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const signatureEl = qs('[data-signature]');
  if (signatureEl) signatureEl.textContent = site.signature;
}
