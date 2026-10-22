/**
 * Pages HTML du site public, rendues côté serveur à partir des gabarits de site/.
 *
 * L'interface OV7 OS est construite en JavaScript, mais chaque adresse
 * (/projets/vaultdesk, /contact…) reçoit son titre, sa description, ses balises
 * Open Graph et une version texte du contenu dans <noscript> : les moteurs de
 * recherche et les aperçus de liens n'ont pas besoin d'exécuter le script.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { escapeHtml as e, formatDate } from '../../shared/util.js';

const APP_ROUTES = {
  'a-propos': { title: 'À propos', describe: (c) => firstParagraph(c.about.intro) },
  services: { title: 'Services', describe: (c) => c.services.intro },
  projets: { title: 'Projets', describe: (c) => `${c.projects.items.length} projets : ${c.projects.items.map((p) => p.name).join(', ')}.` },
  stack: { title: 'Stack technique', describe: (c) => c.technologies.groups.map((g) => `${g.label} : ${g.items.map((i) => i.name).join(', ')}`).join(' · ') },
  avis: { title: 'Avis clients', describe: (c) => `Les avis des clients de ${c.identity.name}.` },
  contact: { title: 'Contact & devis', describe: (c) => c.contact.intro },
  terminal: { title: 'Terminal' },
  parametres: { title: 'Paramètres' },
  corbeille: { title: 'Corbeille' },
};

const firstParagraph = (text) => String(text || '').split(/\n\s*\n/)[0];

/** Résout un chemin du site : { found, title, description, image? }. */
export function resolveRoute(pathname, content) {
  const [first, second, ...rest] = pathname.split('/').filter(Boolean);
  const { identity } = content;
  const base = { found: true, title: `${identity.name} — ${identity.tagline || identity.role}`, description: identity.description };

  if (!first) return base;
  if (first === 'projets' && second && !rest.length) {
    const project = content.projects.items.find((p) => p.id === second);
    if (!project) return { ...base, found: false, title: `Projet introuvable — ${identity.name}` };
    return { found: true, title: `${project.name} — ${identity.name}`, description: project.summary, image: project.cover };
  }
  const route = APP_ROUTES[first];
  if (!route || second) return { ...base, found: false, title: `Page introuvable — ${identity.name}` };
  return { found: true, title: `${route.title} — ${identity.name}`, description: route.describe?.(content) || identity.description };
}

function readTemplate(name) {
  return fs.readFileSync(path.join(config.siteDir, name), 'utf8');
}

function absolute(url) {
  if (!url) return `${config.siteUrl}/assets/og-image.png`;
  return url.startsWith('/') ? config.siteUrl + url : url;
}

function headTags(route, pathname, content) {
  const { identity, socials } = content;
  const url = config.siteUrl + (pathname === '/' ? '/' : pathname);
  const description = String(route.description || '').slice(0, 300);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: identity.name,
    url: config.siteUrl,
    description: identity.description,
    email: identity.email || undefined,
    sameAs: socials.links.map((l) => l.href).filter(Boolean),
  };
  return [
    `<title>${e(route.title)}</title>`,
    `<meta name="description" content="${e(description)}">`,
    `<link rel="canonical" href="${e(url)}">`,
    route.found ? '' : '<meta name="robots" content="noindex">',
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${e(identity.name)}">`,
    `<meta property="og:title" content="${e(route.title)}">`,
    `<meta property="og:description" content="${e(description)}">`,
    `<meta property="og:url" content="${e(url)}">`,
    `<meta property="og:image" content="${e(absolute(route.image))}">`,
    `<meta property="og:locale" content="fr_FR">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="#0b0d10">`,
    // `<` est échappé pour qu'aucun texte saisi ne puisse refermer la balise.
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ');
}

/** Version texte intégrale, lisible sans JavaScript. */
function noscriptContent(content) {
  const { identity, about, services, projects, reviews, pricing, socials } = content;
  return `
  <div class="noscript">
    <h1>${e(identity.name)}</h1>
    <p>${e(identity.tagline)}</p>
    <p>${e(identity.description)}</p>
    <h2>${e(about.headline)}</h2>
    ${about.intro.split(/\n\s*\n/).map((p) => `<p>${e(p)}</p>`).join('')}
    <h2>Services</h2>
    ${services.poles.map((pole) => `<h3>${e(pole.title)}</h3><ul>${pole.services.map((s) => `<li><strong>${e(s.title)}</strong> — ${e(s.text)}</li>`).join('')}</ul>`).join('')}
    <h2>Projets</h2>
    <ul>${projects.items.map((p) => `<li><a href="/projets/${e(p.id)}">${e(p.name)}</a> — ${e(p.summary)}</li>`).join('')}</ul>
    ${reviews.items.length ? `<h2>Avis clients</h2>${reviews.items.map((r) => `<blockquote><p>${e(r.text)}</p><footer>${e(r.name)}${r.date ? ', ' + e(formatDate(r.date)) : ''}</footer></blockquote>`).join('')}` : ''}
    <h2>Tarifs</h2>
    <ul>${pricing.items.map((p) => `<li>${e(p.scope)} : à partir de ${e(p.from)} — ${e(p.detail)}</li>`).join('')}</ul>
    <h2>Contact</h2>
    <p>${identity.email ? `<a href="mailto:${e(identity.email)}">${e(identity.email)}</a>` : ''}${identity.discord ? ` · Discord : ${e(identity.discord)}` : ''}</p>
    <p>${socials.links.map((l) => `<a href="${e(l.href)}" rel="me noopener">${e(l.label)}</a>`).join(' · ')}</p>
  </div>`;
}

export function renderSite(pathname, content, { preview = false } = {}) {
  const route = resolveRoute(pathname, content);
  const html = readTemplate('index.html')
    .replace('<!--SEO-->', headTags(route, pathname, content))
    .replace('<!--NOSCRIPT-->', noscriptContent(content))
    .replace('data-preview="0"', `data-preview="${preview ? 1 : 0}"`);
  return { status: route.found ? 200 : 404, html };
}

export function renderMaintenance(maintenance, content) {
  const html = readTemplate('maintenance.html')
    .replaceAll('{{os}}', e(content.os.osName))
    .replaceAll('{{name}}', e(content.identity.name))
    .replaceAll('{{title}}', e(maintenance.title))
    .replaceAll('{{message}}', e(maintenance.message))
    .replaceAll('{{eta}}', maintenance.eta ? `Retour estimé : ${e(maintenance.eta)}` : '')
    .replaceAll('{{accent}}', e(content.os.accent));
  return html;
}

export function renderSitemap(content) {
  const urls = ['/', ...Object.keys(APP_ROUTES).filter((r) => !['terminal', 'parametres', 'corbeille'].includes(r)).map((r) => `/${r}`), ...content.projects.items.map((p) => `/projets/${p.id}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${e(config.siteUrl + u)}</loc></url>`).join('\n')}
</urlset>
`;
}

export function renderRobots() {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`;
}
