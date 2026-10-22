/**
 * Mesure d'audience minimale et sans cookie : pages vues et visiteurs uniques
 * par jour. Les visiteurs sont comptés via une empreinte (IP + navigateur +
 * sel du jour) qui n'est jamais écrite sur disque.
 */

import crypto from 'node:crypto';
import { readJson, writeJson } from './store.js';

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|monitor|curl|wget|python|headless/i;
const KEEP_DAYS = 90;

let stats;
let dirty = false;
let today = '';
let seen = new Set();
let salt = '';

export function initStats() {
  stats = readJson('stats.json', { days: {} });
  setInterval(flush, 30_000).unref();
}

export function flush() {
  if (!dirty) return;
  const keys = Object.keys(stats.days).sort();
  for (const key of keys.slice(0, Math.max(0, keys.length - KEEP_DAYS))) delete stats.days[key];
  writeJson('stats.json', stats);
  dirty = false;
}

export function recordView(req, ip) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT.test(ua)) return;

  const day = new Date().toISOString().slice(0, 10);
  if (day !== today) {
    today = day;
    seen = new Set();
    salt = crypto.randomBytes(16).toString('hex');
  }
  const entry = (stats.days[day] ||= { views: 0, visitors: 0 });
  entry.views += 1;
  const fingerprint = crypto.createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex');
  if (!seen.has(fingerprint)) {
    seen.add(fingerprint);
    entry.visitors += 1;
  }
  dirty = true;
}

/** Les N derniers jours, du plus ancien au plus récent, jours vides inclus. */
export function lastDays(n = 14) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day, ...(stats.days[day] || { views: 0, visitors: 0 }) });
  }
  return out;
}
