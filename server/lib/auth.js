/**
 * Authentification du logiciel d'administration.
 *
 * - Un seul compte, mot de passe haché en scrypt (data/auth.json).
 *   Il est créé au premier démarrage à partir de ADMIN_USER / ADMIN_PASSWORD,
 *   puis modifiable depuis le logiciel. `npm run set-password` le réinitialise.
 * - Sessions opaques : seul le hachage du jeton est conservé sur disque.
 * - Jetons d'aperçu signés (HMAC) pour prévisualiser le brouillon sur le site.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import { config } from '../config.js';
import { dataPath, ensureDir, readJson, writeJson } from './store.js';

const SESSION_COOKIE = 'ov7_admin';
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

let secret;
let sessions = new Map();

export function initAuth() {
  ensureDir(config.dataDir);
  const secretFile = dataPath('secret.key');
  if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  secret = fs.readFileSync(secretFile, 'utf8').trim();

  if (!readJson('auth.json', null)) {
    if (config.adminPassword) {
      setCredentials(config.adminUser, config.adminPassword);
      console.log(`[auth] compte « ${config.adminUser} » créé depuis ADMIN_PASSWORD.`);
    } else {
      console.warn('[auth] aucun compte administrateur : définissez ADMIN_PASSWORD puis redémarrez.');
    }
  }

  const now = Date.now();
  sessions = new Map(
    Object.entries(readJson('sessions.json', {})).filter(([, s]) => s.expiresAt > now)
  );
}

export function setCredentials(username, password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  writeJson('auth.json', { username, salt, hash, updatedAt: new Date().toISOString() });
}

export function getUsername() {
  return readJson('auth.json', null)?.username || null;
}

export function verifyCredentials(username, password) {
  const account = readJson('auth.json', null);
  // Un calcul est toujours effectué, compte existant ou non, pour ne rien révéler par le temps de réponse.
  const salt = account?.salt || 'absent';
  const expected = Buffer.from(account?.hash || '0'.repeat(128), 'hex');
  const actual = crypto.scryptSync(String(password), salt, 64);
  const passwordOk = crypto.timingSafeEqual(expected, actual);
  return Boolean(account) && passwordOk && String(username) === account.username;
}

/* ------------------------------ Sessions ------------------------------ */

function persistSessions() {
  writeJson('sessions.json', Object.fromEntries(sessions));
}

export function createSession(meta) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  sessions.set(sha256(token), { ...meta, createdAt: now, expiresAt: now + config.sessionDays * 86_400_000 });
  persistSessions();
  return token;
}

export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(sha256(token));
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(sha256(token));
    persistSessions();
    return null;
  }
  return session;
}

export function destroySession(token) {
  if (token && sessions.delete(sha256(token))) persistSessions();
}

export function destroyAllSessions(exceptToken) {
  const keep = exceptToken ? sha256(exceptToken) : null;
  for (const key of sessions.keys()) if (key !== keep) sessions.delete(key);
  persistSessions();
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  options: () => ({
    maxAge: config.sessionDays * 86_400,
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: 'Strict',
  }),
};

/* ------------------------- Jetons signés (aperçu) ------------------------- */

export function signToken(payload, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
