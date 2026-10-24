/** Point d'entrée d'OV7 OS. */

import { MaintenanceError, loadContent } from './api.js';
import { forgetBoot, shouldBoot, startBoot } from './boot.js';
import { showNotice } from './notice.js';
import { setDefaults } from './prefs.js';
import { createShell } from './shell.js';
import { el, LOGO } from './ui.js';

const root = document.getElementById('os');
const boot = shouldBoot() ? startBoot() : null;

function reboot() {
  forgetBoot();
  location.href = '/';
}

function shutdown() {
  document.body.append(el(`<div class="shutdown">
    <div style="width:48px;height:48px;opacity:.5">${LOGO}</div>
    <p>Vous pouvez maintenant fermer cet onglet en toute sécurité.</p>
    <button type="button">Redémarrer</button>
  </div>`));
  document.querySelector('.shutdown button').addEventListener('click', reboot);
}

async function start() {
  let data;
  try {
    data = await loadContent();
  } catch (error) {
    // En maintenance, le serveur sert sa propre page : un rechargement suffit.
    if (error instanceof MaintenanceError) return location.reload();
    boot?.fail('Connexion au serveur impossible.');
    root.innerHTML = `<div class="empty" style="height:100%">
      <p>Le système n’a pas pu démarrer : le serveur ne répond pas.</p>
      <button class="btn" type="button">Réessayer</button>
    </div>`;
    root.querySelector('button').addEventListener('click', () => location.reload());
    return;
  }

  setDefaults(data.content.os);
  createShell(root, data, { reboot, shutdown });

  if (boot) {
    if (data.content.os.boot) await boot.play(data.content.os.bootLines);
    else await boot.finish();
  }
  // Une fois l'écran de démarrage retiré, pour ne pas le couvrir.
  setTimeout(() => showNotice(root, { privacy: Boolean(data.content.legal.editor) }), boot ? 700 : 400);
}

start();
