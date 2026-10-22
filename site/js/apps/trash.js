/** Corbeille : petit easter egg. */

import { icon } from '/shared/icons.js';
import { escapeHtml as e } from '/shared/util.js';
import { toast } from '../ui.js';

const FILES = [
  { name: 'portfolio-v1-final.zip', size: '2,4 Mo', date: '2023', text: 'Archive corrompue.\nLe premier portfolio repose en paix. Il avait un carrousel automatique.' },
  { name: 'bug-final-FINAL-v3.js', size: '12 Ko', date: '2024', text: '// TODO: comprendre pourquoi ça marche\n// (ça marche)\n// (ne pas toucher)' },
  { name: 'idees-abandonnees.txt', size: '3 Ko', date: '2025', text: '- un portfolio en 3D intégral\n- un portfolio en ligne de commande uniquement\n- un portfolio qui est un système d’exploitation  ← tiens, tiens' },
  { name: 'lorem-ipsum.docx', size: '18 Ko', date: '2025', text: 'Aucun texte de remplissage sur ce site : tout le contenu est réel.' },
];

export default {
  id: 'trash',
  route: 'corbeille',
  title: 'Corbeille',
  icon: 'trash',
  tone: 'slate',
  size: [620, 440],

  render(body) {
    body.innerHTML = `
      <div class="app">
        <div class="files" role="list">
          <div class="file-row is-head"><span></span><span>Nom</span><span>Taille</span><span>Supprimé</span></div>
          ${FILES.map((f, i) => `
            <button class="file-row" type="button" role="listitem" data-file="${i}">
              ${icon('file')}<span>${e(f.name)}</span><small>${f.size}</small><small>${f.date}</small>
            </button>`).join('')}
        </div>
        <pre class="viewer" hidden></pre>
        <div class="widget__actions"><button class="btn btn--sm" type="button" data-empty>${icon('trash')}Vider la corbeille</button></div>
      </div>`;

    const viewer = body.querySelector('.viewer');
    body.addEventListener('click', (event) => {
      const file = event.target.closest('[data-file]');
      if (file) {
        viewer.hidden = false;
        viewer.textContent = FILES[file.dataset.file].text;
      }
      if (event.target.closest('[data-empty]')) {
        toast({ title: 'Action impossible', text: 'Ces fichiers rappellent d’où l’on vient.', iconName: 'trash', tone: 'slate' });
      }
    });
  },
};
