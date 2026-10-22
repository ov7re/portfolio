/**
 * Mise à jour du code depuis le dépôt git (UPDATES_ENABLED=true).
 *
 * Sur le NAS, le dépôt est monté dans le conteneur : appliquer une mise à jour
 * revient à faire un `git merge --ff-only` sur la branche suivie. Le site et le
 * logiciel étant des fichiers statiques, ils changent aussitôt ; si le code du
 * serveur a changé, le processus se termine et Docker le relance.
 */

import { execFile } from 'node:child_process';
import { config } from '../config.js';
import { HttpError } from './http.js';
import { getMaintenance, setMaintenance } from './settings.js';
import { readJson, writeJson, logActivity } from './store.js';

const { repoDir, remote, branch } = config.updates;
const SEP = '\x1f';
const FORMAT = ['%H', '%h', '%s', '%cI', '%an'].join('%x1f');

let applying = false;
let lastCheck = null;

function git(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd: repoDir, timeout: 120_000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error((stderr || error.message).trim().split('\n').slice(-3).join(' ')));
      else resolve(stdout.trim());
    });
  });
}

function parseCommits(text) {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, short, subject, date, author] = line.split(SEP);
      return { hash, short, subject, date, author };
    });
}

export async function updateStatus({ fetch = false } = {}) {
  const base = { enabled: config.updates.enabled, applying, target: `${remote}/${branch}`, history: readJson('updates.json', []).slice(0, 15) };
  if (!config.updates.enabled) return base;

  try {
    await git(['rev-parse', '--is-inside-work-tree']);
  } catch {
    return { ...base, ready: false, error: `Le dossier ${repoDir} n’est pas un dépôt git.` };
  }

  let fetchError = null;
  if (fetch) {
    try {
      await git(['fetch', '--quiet', remote, branch]);
      lastCheck = new Date().toISOString();
    } catch (error) {
      fetchError = error.message;
    }
  }

  const [current] = parseCommits(await git(['log', '-1', `--format=${FORMAT}`]));
  const currentBranch = await git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const dirty = (await git(['status', '--porcelain', '--untracked-files=no'])) !== '';
  let pending = [];
  try {
    pending = parseCommits(await git(['log', `HEAD..${remote}/${branch}`, `--format=${FORMAT}`, '-n', '50']));
  } catch {
    /* branche distante pas encore récupérée */
  }

  return { ...base, ready: true, branch: currentBranch, current, pending, dirty, lastCheck, error: fetchError };
}

export async function applyUpdate({ maintenance = true } = {}) {
  if (!config.updates.enabled) throw new HttpError(400, 'Les mises à jour sont désactivées (UPDATES_ENABLED).');
  if (applying) throw new HttpError(409, 'Une mise à jour est déjà en cours.');
  applying = true;

  const autoMaintenance = maintenance && !getMaintenance().enabled;
  if (autoMaintenance) setMaintenance({ enabled: true, auto: true });

  const history = readJson('updates.json', []);
  const before = await git(['rev-parse', 'HEAD']).catch(() => null);

  try {
    await git(['fetch', '--quiet', remote, branch]);
    await git(['merge', '--ff-only', `${remote}/${branch}`]);
    const after = await git(['rev-parse', 'HEAD']);
    const files = before === after ? [] : (await git(['diff', '--name-only', before, after])).split('\n').filter(Boolean);
    const restart = config.updates.restart && files.some((f) => /^(server|shared)\/|^package\.json$/.test(f));

    history.unshift({ at: new Date().toISOString(), ok: true, from: before?.slice(0, 7), to: after.slice(0, 7), files: files.length, restart });
    writeJson('updates.json', history.slice(0, 50));
    logActivity('Mise à jour du code', `${before?.slice(0, 7)} → ${after.slice(0, 7)} (${files.length} fichier(s))`);

    if (restart) {
      // La maintenance automatique sera levée au redémarrage (voir finishPendingUpdate).
      setTimeout(() => process.exit(0), 1200);
    } else if (autoMaintenance) {
      setMaintenance({ enabled: false });
    }
    return { from: before, to: after, files, restart };
  } catch (error) {
    history.unshift({ at: new Date().toISOString(), ok: false, error: error.message });
    writeJson('updates.json', history.slice(0, 50));
    if (autoMaintenance) setMaintenance({ enabled: false });
    throw new HttpError(500, `Mise à jour impossible : ${error.message}`);
  } finally {
    applying = false;
  }
}

/** Au démarrage : lève la maintenance posée automatiquement par une mise à jour. */
export function finishPendingUpdate() {
  if (getMaintenance().enabled && getMaintenance().auto) {
    setMaintenance({ enabled: false });
    logActivity('Redémarrage', 'Mise à jour terminée, maintenance levée');
  }
}
