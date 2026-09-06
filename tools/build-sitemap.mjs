/**
 * Génère sitemap.xml à partir des données du site.
 * Aucune dépendance : `node tools/build-sitemap.mjs` depuis la racine du projet.
 * À relancer après avoir ajouté ou retiré un projet.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { site } from '../scripts/data/site.js';
import { projects } from '../scripts/data/projects.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: `${site.url}/`, priority: '1.0', changefreq: 'monthly' },
  ...projects.map((project) => ({
    loc: `${site.url}/projet.html?id=${project.id}`,
    priority: '0.7',
    changefreq: 'yearly',
  })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) =>
    [
      '  <url>',
      `    <loc>${url.loc}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${url.changefreq}</changefreq>`,
      `    <priority>${url.priority}</priority>`,
      '  </url>',
    ].join('\n')
  ),
  '</urlset>',
  '',
].join('\n');

writeFileSync(join(root, 'sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml généré — ${urls.length} URLs`);
