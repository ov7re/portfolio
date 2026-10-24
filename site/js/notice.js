/**
 * Bandeau d'information affiché en bas de l'écran une fois le système
 * démarré : le site n'utilise pas de cookie, avec un lien vers la politique
 * de confidentialité. Fermé, il ne réapparaît plus sur ce navigateur.
 */

import { el } from './ui.js';

const KEY = 'ov7.notice';

function dismissed() {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

function remember() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* stockage indisponible (navigation privée) : le bandeau reviendra à la prochaine visite */
  }
}

export function showNotice(root, { privacy }) {
  if (dismissed()) return;

  const node = el(`<aside class="notice" aria-label="Cookies et confidentialité">
    <p><strong>Aucun cookie sur ce site.</strong> Pas de publicité, pas de suivi : seule une mesure d’audience anonyme compte les visites.</p>
    <div class="notice__actions">
      ${privacy ? '<a class="btn btn--sm" href="/mentions-legales/confidentialite" data-legal="confidentialite">Confidentialité</a>' : ''}
      <button class="btn btn--primary btn--sm" type="button" data-close>Compris</button>
    </div>
  </aside>`);
  root.append(node);

  const close = () => {
    remember();
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 250);
  };
  // Le lien est ouvert par le bureau (data-legal) ; le bandeau se ferme aussi.
  node.addEventListener('click', (event) => {
    if (event.target.closest('[data-close], [data-legal]')) close();
  });
}
