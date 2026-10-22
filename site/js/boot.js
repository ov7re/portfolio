/**
 * Écran de démarrage, joué une fois par visite. Il s'affiche dès le chargement
 * du script, pendant que le contenu arrive de l'API, et se passe d'un clic ou
 * d'une touche.
 */

import { escapeHtml as e } from '/shared/util.js';
import { LOGO, el } from './ui.js';

const KEY = 'ov7.booted';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function shouldBoot() {
  try {
    return !sessionStorage.getItem(KEY) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function markBooted() {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* stockage indisponible */
  }
}

export function forgetBoot() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
}

/** Affiche l'écran ; `play(lines)` déroule la séquence puis le retire. */
export function startBoot() {
  const node = el(`<div class="boot" role="status" aria-label="Démarrage">
    <div class="boot__inner">
      <div class="boot__logo">${LOGO}</div>
      <div class="boot__lines"></div>
      <div class="boot__bar"><span></span></div>
    </div>
    <p class="boot__skip">Cliquez ou appuyez sur une touche pour passer</p>
  </div>`);
  document.body.append(node);

  const lines = node.querySelector('.boot__lines');
  const bar = node.querySelector('.boot__bar span');
  let skipped = false;
  const skip = () => (skipped = true);
  node.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });

  const finish = async () => {
    bar.style.width = '100%';
    markBooted();
    await wait(skipped ? 0 : 250);
    node.classList.add('is-done');
    setTimeout(() => node.remove(), 600);
  };

  return {
    async play(steps) {
      for (let i = 0; i < steps.length && !skipped; i++) {
        lines.append(el(`<div class="boot__line"><b>[ ok ]</b><span>${e(steps[i])}</span></div>`));
        bar.style.width = `${Math.round(((i + 1) / (steps.length + 1)) * 100)}%`;
        await wait(170 + Math.random() * 140);
      }
      await finish();
    },
    finish,
    fail(message) {
      lines.innerHTML = `<div class="boot__line"><b style="color:var(--danger)">[ erreur ]</b><span>${e(message)}</span></div>`;
    },
  };
}
