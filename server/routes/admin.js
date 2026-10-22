/**
 * API du logiciel d'administration. Servie uniquement sur les domaines
 * ADMIN_HOSTS, et — hormis la connexion — uniquement avec une session valide.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import {
  createSession, destroySession, destroyAllSessions, getUsername, sessionCookie,
  setCredentials, signToken, verifyCredentials,
} from '../lib/auth.js';
import {
  deploy, discardSection, getDraft, getLive, listReleases, pendingSections,
  restoreDraft, rollback, saveSection,
} from '../lib/content.js';
import { HttpError, readJson as readBodyJson, appendCookie, cookie } from '../lib/http.js';
import { deleteMessage, listMessages, unreadCount, updateMessage } from '../lib/messages.js';
import { createLimiter } from '../lib/ratelimit.js';
import { getMaintenance, setMaintenance } from '../lib/settings.js';
import { lastDays } from '../lib/stats.js';
import { dataPath, ensureDir, logActivity, readJson } from '../lib/store.js';
import { applyUpdate, updateStatus } from '../lib/updater.js';
import { slugify } from '../../shared/util.js';

const loginLimiter = createLimiter({ windowMs: 15 * 60_000, max: 6 });

const UPLOAD_TYPES = {
  'image/png': { ext: '.png', magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/jpeg': { ext: '.jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/webp': { ext: '.webp', magic: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  'image/gif': { ext: '.gif', magic: (b) => b.toString('ascii', 0, 3) === 'GIF' },
};
const MAX_UPLOAD = 8 * 1024 * 1024;

export function adminRoutes(router) {
  /* ------------------------------ Session ------------------------------ */

  router.post('/api/admin/login', async ({ req, res, ip }) => {
    const wait = loginLimiter.hit(ip);
    if (wait) throw new HttpError(429, `Trop de tentatives. Réessayez dans ${Math.ceil(wait / 60)} min.`);
    const { username, password } = await readBodyJson(req, 10_000);
    if (!verifyCredentials(username, password)) {
      logActivity('Connexion refusée', `depuis ${ip}`);
      throw new HttpError(401, 'Identifiant ou mot de passe incorrect.');
    }
    loginLimiter.reset(ip);
    const token = createSession({ ip, ua: String(req.headers['user-agent'] || '').slice(0, 200) });
    appendCookie(res, cookie(sessionCookie.name, token, sessionCookie.options()));
    logActivity('Connexion', `depuis ${ip}`);
    return { username };
  }, { public: true });

  router.post('/api/admin/logout', ({ res, token }) => {
    destroySession(token);
    appendCookie(res, cookie(sessionCookie.name, '', { ...sessionCookie.options(), maxAge: 0 }));
    return { ok: true };
  });

  router.get('/api/admin/session', () => ({ username: getUsername(), siteUrl: config.siteUrl }));

  /* --------------------------- Tableau de bord --------------------------- */

  router.get('/api/admin/dashboard', async () => {
    const draft = getDraft();
    return {
      siteUrl: config.siteUrl,
      release: getLive().release,
      pending: pendingSections(),
      maintenance: getMaintenance(),
      messages: { unread: unreadCount(), total: listMessages().length },
      stats: lastDays(14),
      counts: {
        projects: draft.projects.items.length,
        reviews: draft.reviews.items.length,
        reviewsHidden: draft.reviews.items.filter((r) => r.hidden).length,
      },
      activity: readJson('activity.json', []).slice(0, 8),
      updates: { enabled: config.updates.enabled },
    };
  });

  router.get('/api/admin/activity', () => readJson('activity.json', []));

  /* ------------------------------ Contenu ------------------------------ */

  router.get('/api/admin/content', () => ({
    draft: getDraft(),
    live: getLive().content,
    release: getLive().release,
    pending: pendingSections(),
  }));

  router.put('/api/admin/content/:section', async ({ req, params }) => {
    const { value } = await readBodyJson(req, 2_000_000);
    const saved = saveSection(params.section, value);
    logActivity('Brouillon enregistré', params.section);
    return { value: saved, pending: pendingSections() };
  });

  router.post('/api/admin/content/:section/discard', ({ params }) => {
    const value = discardSection(params.section);
    logActivity('Modifications annulées', params.section);
    return { value, pending: pendingSections() };
  });

  router.post('/api/admin/preview', () => {
    const token = signToken({ scope: 'preview' }, 3600);
    return { url: `${config.siteUrl}/?preview=${encodeURIComponent(token)}` };
  });

  /* ---------------------------- Déploiement ---------------------------- */

  router.post('/api/admin/deploy', async ({ req }) => {
    const { note } = await readBodyJson(req, 10_000);
    return { release: deploy(note), pending: pendingSections() };
  });

  router.get('/api/admin/releases', () => ({ releases: listReleases(), liveId: getLive().release.id }));

  router.post('/api/admin/releases/:id/rollback', ({ params }) => ({ release: rollback(params.id), pending: pendingSections() }));

  router.post('/api/admin/releases/:id/draft', ({ params }) => {
    restoreDraft(params.id);
    return { pending: pendingSections() };
  });

  /* ---------------------------- Maintenance ---------------------------- */

  router.get('/api/admin/maintenance', () => getMaintenance());

  router.put('/api/admin/maintenance', async ({ req }) => {
    const body = await readBodyJson(req, 10_000);
    const before = getMaintenance().enabled;
    const next = setMaintenance({ ...body, auto: false });
    if (before !== next.enabled) logActivity(next.enabled ? 'Maintenance activée' : 'Maintenance désactivée');
    return next;
  });

  /* ------------------------------ Messages ------------------------------ */

  router.get('/api/admin/messages', () => listMessages());
  router.patch('/api/admin/messages/:id', async ({ req, params }) => updateMessage(params.id, await readBodyJson(req, 10_000)));
  router.delete('/api/admin/messages/:id', ({ params }) => {
    deleteMessage(params.id);
    return { ok: true };
  });

  /* ------------------------------- Médias ------------------------------- */

  router.get('/api/admin/uploads', () => {
    const dir = dataPath('uploads');
    ensureDir(dir);
    return fs.readdirSync(dir)
      .map((name) => {
        const stat = fs.statSync(path.join(dir, name));
        return { name, url: `/uploads/${name}`, size: stat.size, createdAt: stat.mtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  router.post('/api/admin/uploads', async ({ req }) => {
    const { name, data } = await readBodyJson(req, Math.ceil(MAX_UPLOAD * 1.4));
    const match = String(data || '').match(/^data:([\w/+.-]+);base64,(.+)$/);
    const type = match && UPLOAD_TYPES[match[1]];
    if (!type) throw new HttpError(415, 'Formats acceptés : PNG, JPEG, WebP, GIF.');
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_UPLOAD) throw new HttpError(413, 'Image trop lourde (8 Mo maximum).');
    if (!type.magic(buffer)) throw new HttpError(415, 'Le contenu du fichier ne correspond pas à son format.');

    const base = slugify(String(name || 'image').replace(/\.[^.]+$/, '')) || 'image';
    const file = `${base}-${crypto.randomBytes(3).toString('hex')}${type.ext}`;
    ensureDir(dataPath('uploads'));
    fs.writeFileSync(dataPath('uploads', file), buffer);
    logActivity('Image ajoutée', file);
    return { name: file, url: `/uploads/${file}`, size: buffer.length };
  });

  router.delete('/api/admin/uploads/:name', ({ params }) => {
    const name = path.basename(params.name);
    const file = dataPath('uploads', name);
    if (!fs.existsSync(file)) throw new HttpError(404, 'Fichier introuvable.');
    fs.rmSync(file);
    logActivity('Image supprimée', name);
    return { ok: true };
  });

  /* ---------------------------- Mises à jour ---------------------------- */

  router.get('/api/admin/updates', ({ url }) => updateStatus({ fetch: url.searchParams.has('fetch') }));
  router.post('/api/admin/updates/apply', async ({ req }) => {
    const { maintenance = true } = await readBodyJson(req, 1000);
    return applyUpdate({ maintenance });
  });

  /* ------------------------------- Compte ------------------------------- */

  router.post('/api/admin/account/password', async ({ req, token }) => {
    const { current, next } = await readBodyJson(req, 10_000);
    const username = getUsername();
    if (!verifyCredentials(username, current)) throw new HttpError(403, 'Mot de passe actuel incorrect.');
    if (String(next || '').length < 12) throw new HttpError(422, 'Le nouveau mot de passe doit faire au moins 12 caractères.');
    setCredentials(username, String(next));
    destroyAllSessions(token);
    logActivity('Mot de passe modifié', 'autres sessions déconnectées');
    return { ok: true };
  });

  router.post('/api/admin/account/logout-all', ({ token }) => {
    destroyAllSessions(token);
    logActivity('Sessions fermées', 'toutes sauf la session actuelle');
    return { ok: true };
  });
}
