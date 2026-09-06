/**
 * Header : état au défilement, menu mobile, lien actif, bascule de thème.
 */

import { qs, qsa, html, raw, render } from '../lib/dom.js';
import { bindThemeToggles } from '../lib/theme.js';
import { navLinks } from '../data/site.js';
import { icon } from '../lib/icons.js';

const MOBILE_BREAKPOINT = 900;

function buildMobileNav(container) {
  render(
    container,
    html`
      ${raw(
        navLinks
          .map(
            (link) =>
              html`<a class="mobile-nav__link" href="${link.href}" data-mobile-link>${link.label}</a>`
          )
          .join('')
      )}
      <a class="btn btn--primary" href="#contact" data-mobile-link>
        Demander un devis ${raw(icon('arrowRight'))}
      </a>
    `
  );
  qsa('a.btn svg', container).forEach((svg) => svg.classList.add('btn__icon', 'btn__icon--arrow'));
}

function setupMobileMenu(header) {
  const burger = qs('[data-burger]', header);
  const panel = qs('[data-mobile-nav]');
  if (!burger || !panel) return;

  buildMobileNav(panel);

  const close = () => {
    burger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  };

  const open = () => {
    burger.setAttribute('aria-expanded', 'true');
    panel.classList.add('is-open');
    document.body.classList.add('no-scroll');
  };

  burger.addEventListener('click', () => {
    const isOpen = burger.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-mobile-link]')) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) close();
  });
}

function setupScrollState(header) {
  const update = () => header.classList.toggle('is-stuck', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function setupActiveLink() {
  const links = qsa('[data-nav-link]');
  if (!links.length) return;

  const sections = links
    .map((link) => {
      const id = link.getAttribute('href');
      return id && id.startsWith('#') ? qs(id) : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) =>
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

export function mountHeader() {
  const header = qs('[data-header]');
  if (!header) return;

  setupScrollState(header);
  setupMobileMenu(header);
  setupActiveLink();
  bindThemeToggles();
}
