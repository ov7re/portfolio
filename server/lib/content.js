/**
 * Contenu du site : un brouillon modifiable et des versions déployées.
 *
 *   data/draft.json            brouillon édité depuis le logiciel
 *   data/releases/0007.json    chaque déploiement, contenu complet figé
 *   data/releases.json         index des versions (la plus récente en tête)
 *   data/live.json             version actuellement servie au public
 *
 * Le site public ne lit que la version en ligne. Déployer = figer le brouillon
 * dans une nouvelle version ; restaurer = redéployer une version passée.
 */

import { sanitizeContent, sanitizeSection, SECTION_KEYS, getSection } from '../../shared/schema.js';
import { seedContent } from '../seed/content.js';
import { HttpError } from './http.js';
import { readJson, writeJson, removeFile, logActivity } from './store.js';

const KEEP_RELEASES = 50;
const listeners = new Set();

let draft;
let live; // { release, content }
let releases;

const releaseFile = (id) => `releases/${id}.json`;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function initContent() {
  // Le nettoyage au chargement fait aussi office de migration : un champ ajouté
  // au schéma apparaît avec sa valeur par défaut, un champ retiré disparaît.
  draft = sanitizeContent(readJson('draft.json', () => seedContent));
  writeJson('draft.json', draft);

  releases = readJson('releases.json', []);
  const pointer = readJson('live.json', null);
  const stored = pointer && readJson(releaseFile(pointer.id), null);

  if (stored) {
    live = { release: metaOf(stored), content: sanitizeContent(stored.content) };
  } else {
    createRelease('Installation initiale', draft, Object.keys(draft));
  }
}

export function onLiveChange(fn) {
  listeners.add(fn);
}

function metaOf(release) {
  const { content, ...meta } = release;
  return meta;
}

function createRelease(note, content, sections, author = 'admin') {
  const version = (releases[0]?.version || 0) + 1;
  const id = String(version).padStart(4, '0');
  const release = {
    id,
    version,
    createdAt: new Date().toISOString(),
    note: String(note || '').slice(0, 300),
    sections,
    author,
  };
  writeJson(releaseFile(id), { ...release, content });
  releases.unshift(release);

  for (const old of releases.splice(KEEP_RELEASES)) removeFile(releaseFile(old.id));
  writeJson('releases.json', releases);
  writeJson('live.json', { id });

  live = { release, content: structuredClone(content) };
  for (const fn of listeners) fn(live);
  return release;
}

/* ------------------------------ Lecture ------------------------------ */

export const getDraft = () => draft;
export const getLive = () => live;
export const listReleases = () => releases;

export function pendingSections() {
  return SECTION_KEYS.filter((key) => !same(draft[key], live.content[key]));
}

/** Version publique : éléments masqués retirés. */
export function publicView(content) {
  return {
    ...content,
    projects: {
      ...content.projects,
      items: content.projects.items.filter((p) => !p.hidden),
    },
    reviews: { items: content.reviews.items.filter((r) => !r.hidden && r.text.trim()) },
  };
}

/* ------------------------------ Écriture ------------------------------ */

export function saveSection(key, value) {
  if (!getSection(key)) throw new HttpError(404, 'Section inconnue.');
  draft[key] = sanitizeSection(key, value);
  writeJson('draft.json', draft);
  return draft[key];
}

export function discardSection(key) {
  if (!getSection(key)) throw new HttpError(404, 'Section inconnue.');
  draft[key] = structuredClone(live.content[key]);
  writeJson('draft.json', draft);
  return draft[key];
}

export function deploy(note) {
  const sections = pendingSections();
  if (!sections.length) throw new HttpError(409, 'Aucune modification à déployer.');
  const release = createRelease(note || 'Mise à jour du contenu', structuredClone(draft), sections);
  logActivity('Déploiement', `v${release.version} — ${sections.map((k) => getSection(k).label).join(', ')}`);
  return release;
}

function loadRelease(id) {
  const stored = readJson(releaseFile(id), null);
  if (!stored) throw new HttpError(404, 'Version introuvable.');
  return { meta: metaOf(stored), content: sanitizeContent(stored.content) };
}

/** Remet en ligne une ancienne version (sous la forme d'une nouvelle version). */
export function rollback(id) {
  const { meta, content } = loadRelease(id);
  const sections = SECTION_KEYS.filter((key) => !same(content[key], live.content[key]));
  const release = createRelease(`Restauration de la v${meta.version}`, content, sections);
  logActivity('Restauration', `v${meta.version} remise en ligne (v${release.version})`);
  return release;
}

/** Recopie une version dans le brouillon, sans rien mettre en ligne. */
export function restoreDraft(id) {
  const { meta, content } = loadRelease(id);
  draft = content;
  writeJson('draft.json', draft);
  logActivity('Brouillon restauré', `depuis la v${meta.version}`);
  return draft;
}
