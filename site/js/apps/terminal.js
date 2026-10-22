/** Terminal invité : explorer le portfolio en ligne de commande. */

import { escapeHtml as e } from '/shared/util.js';
import { getPref, setPref } from '../prefs.js';

const STARTED = Date.now();

export default {
  id: 'terminal',
  route: 'terminal',
  title: 'Terminal',
  icon: 'terminal',
  tone: 'ink',
  size: [720, 460],

  render(body, { content, os, apps }) {
    const { identity, projects, technologies, reviews, services, os: system } = content;
    const user = 'invite';
    const host = (identity.shortName || 'ov7').toLowerCase();
    const history = [];
    let cursor = 0;

    body.innerHTML = `
      <div class="term" role="log" aria-label="Terminal">
        <div class="term__out"></div>
        <div class="term__line">
          <label class="term__prompt" for="term-input"><b>${e(user)}@${e(host)}</b>:~$</label>
          <input id="term-input" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Commande">
        </div>
      </div>`;

    const term = body.querySelector('.term');
    const out = body.querySelector('.term__out');
    const input = body.querySelector('input');

    const print = (markup = '') => {
      out.insertAdjacentHTML('beforeend', `${markup}\n`);
      term.scrollTop = term.scrollHeight;
    };
    const span = (cls, text) => `<span class="${cls}">${e(text)}</span>`;
    const link = (label, action) => `<button class="t-link" type="button" data-run="${e(action)}">${e(label)}</button>`;
    const pad = (text, n) => String(text).padEnd(n, ' ');
    const appByName = (name) => apps.find((a) => a.id === name || a.route === name || a.title.toLowerCase() === name);

    const COMMANDS = {
      aide: { desc: 'liste des commandes', run: () => {
        print(span('c-dim', 'Commandes disponibles :'));
        for (const [name, cmd] of Object.entries(COMMANDS)) if (!cmd.hidden) print(`  ${span('c-acc', pad(name, 12))}${e(cmd.desc)}`);
      } },
      whoami: { desc: 'qui suis-je', run: () => {
        print(`${span('c-ok', identity.owner || identity.name)} — ${e(identity.role)}`);
        print(e(identity.tagline));
      } },
      apropos: { desc: 'présentation', run: () => {
        print(e(content.about.intro));
        print(link('→ ouvrir À propos', 'ouvrir a-propos'));
      } },
      projets: { desc: 'liste des projets', run: () => {
        for (const p of projects.items) print(`  ${span('c-acc', pad(p.id, 18))}${e(p.name)} ${span('c-dim', '— ' + p.status)}`);
        print(span('c-dim', `\n${projects.items.length} projet(s). « cat <id> » pour le détail, « ouvrir <id> » pour la fiche.`));
      } },
      cat: { desc: 'détail d’un projet', run: ([id]) => {
        const p = projects.items.find((x) => x.id === id);
        if (!p) return print(span('c-err', `cat: ${id || '?'}: projet introuvable. Essayez « projets ».`));
        print(span('c-ok', p.name));
        print(e(p.summary));
        if (p.tech.length) print(span('c-dim', `stack : ${p.tech.join(', ')}`));
        print(link('→ ouvrir la fiche', `ouvrir ${p.id}`));
      } },
      services: { desc: 'prestations', run: () => {
        for (const pole of services.poles) {
          print(span('c-acc', pole.title));
          for (const s of pole.services) print(`  • ${e(s.title)} ${span('c-dim', '— ' + s.text)}`);
        }
      } },
      stack: { desc: 'technologies', run: () => {
        for (const g of technologies.groups) print(`${span('c-acc', pad(g.label, 12))}${e(g.items.map((i) => i.name).join(', '))}`);
      } },
      avis: { desc: 'avis clients', run: () => {
        if (!reviews.items.length) return print(span('c-dim', 'Aucun avis pour le moment.'));
        for (const r of reviews.items) print(`${span('c-warn', '★'.repeat(r.rating))} ${e(r.text.split('\n')[0])} ${span('c-dim', '— ' + r.name)}`);
      } },
      contact: { desc: 'me contacter', run: () => {
        if (identity.email) print(`e-mail   ${e(identity.email)}`);
        if (identity.discord) print(`discord  ${e(identity.discord)}`);
        print(link('→ ouvrir le formulaire', 'ouvrir contact'));
      } },
      ouvrir: { desc: 'ouvrir une app ou un projet', run: ([name = '']) => {
        const target = name.toLowerCase();
        const app = appByName(target);
        if (app) return os.open(app.id);
        if (projects.items.some((p) => p.id === target)) return os.open('projects', { sub: target });
        print(span('c-err', `ouvrir: ${name || '?'}: introuvable.`) + span('c-dim', ` Apps : ${apps.map((a) => a.route).join(', ')}`));
      } },
      neofetch: { desc: 'infos système', run: () => {
        const up = Math.max(1, Math.round((Date.now() - STARTED) / 60000));
        const logo = ['  ▄▄▄▄▄▄▄▄▄▄▄ ', '  █████████▀  ', '       ▄██▀   ', '     ▄██▀     ', '    ███       ', '   ███        '];
        const info = [
          `${span('c-ok', user + '@' + host)}`,
          span('c-dim', '─'.repeat(18)),
          `${span('c-acc', 'OS')}       ${e(system.osName)} v${os.meta.version}`,
          `${span('c-acc', 'Hôte')}     ${e(location.host)}`,
          `${span('c-acc', 'Session')}  ${up} min`,
          `${span('c-acc', 'Projets')}  ${projects.items.length}`,
          `${span('c-acc', 'Stack')}    ${technologies.groups.reduce((n, g) => n + g.items.length, 0)} technologies`,
          `${span('c-acc', 'Écran')}    ${innerWidth}×${innerHeight}`,
        ];
        for (let i = 0; i < Math.max(logo.length, info.length); i++) print(`${span('c-acc', logo[i] || ' '.repeat(14))}  ${info[i] || ''}`);
      } },
      theme: { desc: 'clair | sombre', run: ([mode]) => {
        const next = mode === 'clair' ? 'light' : mode === 'sombre' ? 'dark' : getPref('theme') === 'dark' ? 'light' : 'dark';
        setPref('theme', next);
        print(span('c-ok', `Thème ${next === 'light' ? 'clair' : 'sombre'} appliqué.`));
      } },
      date: { desc: 'date et heure', run: () => print(e(new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' }))) },
      echo: { desc: 'répéter un texte', run: (args) => print(e(args.join(' '))) },
      historique: { desc: 'commandes tapées', run: () => history.forEach((h, i) => print(`${span('c-dim', String(i + 1).padStart(3))}  ${e(h)}`)) },
      effacer: { desc: 'vider l’écran', run: () => (out.innerHTML = '') },
      quitter: { desc: 'fermer le terminal', run: () => os.close() },
      sudo: { hidden: true, run: () => print(span('c-err', `${user} n’apparaît pas dans le fichier sudoers. Cet incident sera signalé.`)) },
      rm: { hidden: true, run: () => print(span('c-err', 'rm: permission refusée — ce portfolio est en lecture seule.')) },
      ls: { hidden: true, run: () => print(apps.map((a) => span('c-acc', a.route + '/')).join('  ')) },
      exit: { hidden: true, run: () => os.close() },
    };
    const ALIASES = { help: 'aide', clear: 'effacer', cls: 'effacer', about: 'apropos', projects: 'projets', open: 'ouvrir', history: 'historique', reviews: 'avis', 'a-propos': 'apropos' };

    function run(line) {
      print(`<span class="term__prompt"><b>${e(user)}@${e(host)}</b>:~$</span> ${e(line)}`);
      const [raw, ...args] = line.trim().split(/\s+/);
      if (!raw) return;
      history.push(line);
      cursor = history.length;
      const name = ALIASES[raw.toLowerCase()] || raw.toLowerCase();
      const cmd = COMMANDS[name];
      if (cmd) cmd.run(args);
      else print(span('c-err', `${raw} : commande introuvable.`) + span('c-dim', ' Tapez « aide ».'));
    }

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        run(input.value);
        input.value = '';
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        cursor = Math.max(0, cursor - 1);
        input.value = history[cursor] ?? input.value;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        cursor = Math.min(history.length, cursor + 1);
        input.value = history[cursor] ?? '';
      } else if (event.key === 'Tab') {
        event.preventDefault();
        const [first, ...rest] = input.value.split(' ');
        const pool = rest.length ? [...projects.items.map((p) => p.id), ...apps.map((a) => a.route)] : Object.keys(COMMANDS).filter((c) => !COMMANDS[c].hidden);
        const word = rest.length ? rest.at(-1) : first;
        const matches = pool.filter((c) => c.startsWith(word.toLowerCase()));
        if (matches.length === 1) input.value = rest.length ? [first, ...rest.slice(0, -1), matches[0]].join(' ') : `${matches[0]} `;
        else if (matches.length > 1) print(span('c-dim', matches.join('  ')));
      } else if (event.key === 'l' && event.ctrlKey) {
        event.preventDefault();
        out.innerHTML = '';
      }
    });

    term.addEventListener('click', (event) => {
      const action = event.target.closest('[data-run]');
      if (action) run(action.dataset.run);
      if (!getSelection().toString()) input.focus();
    });

    for (const line of (system.motd || '').split('\n')) print(span('c-dim', line));
    print('');
    setTimeout(() => input.focus(), 50);

    return { update: () => input.focus() };
  },
};
