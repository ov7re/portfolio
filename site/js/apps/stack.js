/** Stack technique, regroupée par domaine. */

import { escapeHtml as e, plural } from '/shared/util.js';

export default {
  id: 'stack',
  route: 'stack',
  title: 'Stack technique',
  icon: 'chip',
  tone: 'violet',
  size: [780, 600],

  render(body, { content }) {
    const { groups } = content.technologies;
    const total = groups.reduce((n, g) => n + g.items.length, 0);
    body.innerHTML = `
      <div class="app">
        <p class="kicker">${plural(total, 'technologie')} · ${plural(groups.length, 'domaine')}</p>
        <h1 class="h1" style="margin-top:8px">Les outils du quotidien</h1>
        ${groups.map((g) => `
          <section class="section">
            <h2 class="h2">${e(g.label)}</h2>
            <div class="tech-grid">
              ${g.items.map((t) => `
                <div class="tech">
                  <span class="tech__mark" aria-hidden="true">${e(t.mark || t.name.slice(0, 2))}</span>
                  <span class="tech__name">${e(t.name)}</span>
                </div>`).join('')}
            </div>
          </section>`).join('')}
      </div>`;
  },
};
