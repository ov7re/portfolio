/**
 * Persistance en fichiers JSON dans DATA_DIR.
 * Écriture atomique (fichier temporaire puis renommage) : un arrêt brutal du
 * NAS pendant une sauvegarde ne laisse jamais un fichier à moitié écrit.
 */

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

export function dataPath(...parts) {
  return path.join(config.dataDir, ...parts);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(dataPath(name), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(`[store] lecture impossible de ${name} :`, error.message);
    return typeof fallback === 'function' ? fallback() : structuredClone(fallback);
  }
}

export function writeJson(name, data) {
  const file = dataPath(name);
  ensureDir(path.dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function removeFile(name) {
  fs.rmSync(dataPath(name), { force: true });
}

/** Journal d'activité du logiciel (200 dernières actions). */
export function logActivity(action, detail = '') {
  const log = readJson('activity.json', []);
  log.unshift({ at: new Date().toISOString(), action, detail });
  writeJson('activity.json', log.slice(0, 200));
}
