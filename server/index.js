/**
 * Serveur OV7 : un seul processus Node, sans dépendance, qui sert
 *   - le site public OV7 OS          (ov7.fr)
 *   - le logiciel d'administration   (admin.ov7.fr — ADMIN_HOSTS)
 *   - l'API qui les relie            (/api/public/* et /api/admin/*)
 *
 * Sur le NAS, le tunnel Cloudflare envoie les deux domaines vers ce serveur.
 */

import http from 'node:http';
import path from 'node:path';
import { config } from './config.js';
import { initAuth, getSession, sessionCookie, verifyToken } from './lib/auth.js';
import { initContent, getDraft, getLive, publicView } from './lib/content.js';
import {
  HttpError, Router, appendCookie, clientIp, cookie, hostOf, parseCookies,
  redirect, sendJson, sendText,
} from './lib/http.js';
import { renderMaintenance, renderRobots, renderSite, renderSitemap } from './lib/pages.js';
import { initSettings, getMaintenance } from './lib/settings.js';
import { serveFile } from './lib/static.js';
import { initStats, flush as flushStats, recordView } from './lib/stats.js';
import { dataPath } from './lib/store.js';
import { finishPendingUpdate } from './lib/updater.js';
import { adminRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';

initAuth();
initSettings();
initContent();
initStats();
finishPendingUpdate();

const router = new Router();
publicRoutes(router);
adminRoutes(router);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

const notFound = (res) => sendText(res, 404, 'Introuvable.');

async function handleApi(req, res, url, ctx) {
  const match = router.match(req.method, url.pathname);
  if (!match) return sendJson(res, 404, { error: 'Route inconnue.' });
  if (match.methodNotAllowed) return sendJson(res, 405, { error: 'Méthode non autorisée.' });

  const adminRoute = url.pathname.startsWith('/api/admin/');
  // L'API d'administration n'existe pas sur le domaine public.
  if (adminRoute && !ctx.adminHost) return sendJson(res, 404, { error: 'Route inconnue.' });

  const token = ctx.cookies[sessionCookie.name];
  let session = null;
  if (adminRoute) {
    // Protection CSRF : un autre site ne peut pas ajouter cet en-tête sans
    // déclencher une requête préliminaire CORS, que ce serveur refuse.
    if (req.method !== 'GET' && req.headers['x-ov7'] !== '1') return sendJson(res, 403, { error: 'Requête refusée.' });
    session = getSession(token);
    if (!session && !match.options.public) return sendJson(res, 401, { error: 'Session expirée.' });
  }

  const preview = !adminRoute && Boolean(verifyToken(ctx.cookies.ov7_preview));
  const result = await match.handler({ req, res, url, params: match.params, ip: ctx.ip, token, session, preview });
  if (!res.headersSent) sendJson(res, 200, result ?? { ok: true });
}

function serveAdmin(req, res, url) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (serveFile(req, res, config.adminDir, url.pathname, { maxAge: 0 })) return;
  if (path.extname(url.pathname)) return notFound(res);
  serveFile(req, res, config.adminDir, '/index.html');
}

function serveSite(req, res, url, ctx) {
  const { pathname } = url;

  // Lien d'aperçu généré par le logiciel : il pose un cookie d'une heure puis
  // redirige vers l'adresse propre.
  const previewParam = url.searchParams.get('preview');
  if (previewParam !== null) {
    if (verifyToken(previewParam)) {
      appendCookie(res, cookie('ov7_preview', previewParam, { maxAge: 3600, secure: config.secureCookies }));
    }
    return redirect(res, pathname);
  }

  if (pathname === '/robots.txt') return sendText(res, 200, renderRobots());
  if (pathname === '/sitemap.xml') {
    return sendText(res, 200, renderSitemap(publicView(getLive().content)), 'application/xml; charset=utf-8');
  }

  const isTemplate = ['/', '/index.html', '/maintenance.html'].includes(pathname);
  if (!isTemplate && serveFile(req, res, config.siteDir, pathname, { maxAge: 0 })) return;
  if (path.extname(pathname) && !isTemplate) return notFound(res);

  const preview = Boolean(verifyToken(ctx.cookies.ov7_preview));
  const content = publicView(preview ? getDraft() : getLive().content);
  const maintenance = getMaintenance();

  if (maintenance.enabled && !preview) {
    return sendText(res, 503, renderMaintenance(maintenance, content), 'text/html; charset=utf-8', {
      'Retry-After': '120',
      'Cache-Control': 'no-store',
    });
  }

  if (!preview) recordView(req, ctx.ip);
  const page = renderSite(pathname === '/index.html' ? '/' : pathname, content, { preview });
  sendText(res, page.status, page.html, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
}

const server = http.createServer(async (req, res) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(key, value);
  if (config.secureCookies) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  try {
    const url = new URL(req.url, 'http://localhost');
    const host = hostOf(req);
    const ctx = {
      host,
      adminHost: config.adminHosts.includes(host),
      ip: clientIp(req),
      cookies: parseCookies(req),
    };

    if (host.startsWith('www.')) return redirect(res, `https://${host.slice(4)}${req.url}`, 301);
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url, ctx);
    if (!['GET', 'HEAD'].includes(req.method)) return sendText(res, 405, 'Méthode non autorisée.');

    if (url.pathname.startsWith('/shared/')) {
      return serveFile(req, res, config.sharedDir, url.pathname.slice('/shared'.length), { maxAge: 0 }) || notFound(res);
    }
    if (url.pathname.startsWith('/uploads/')) {
      return serveFile(req, res, dataPath('uploads'), url.pathname.slice('/uploads'.length), { maxAge: 86_400 }) || notFound(res);
    }
    if (ctx.adminHost) return serveAdmin(req, res, url);
    return serveSite(req, res, url, ctx);
  } catch (error) {
    if (error instanceof HttpError) {
      return sendJson(res, error.status, { error: error.message, details: error.details });
    }
    console.error('[serveur]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Erreur interne du serveur.' });
    else res.end();
  }
});

server.listen(config.port, config.host, () => {
  console.log(`OV7 en ligne sur http://${config.host}:${config.port}`);
  console.log(`  site         ${config.siteUrl}`);
  console.log(`  logiciel     ${config.adminHosts.map((h) => `http://${h}:${config.port}`).join(', ')}`);
  console.log(`  version      v${getLive().release.version}`);
});

function shutdown(signal) {
  console.log(`${signal} reçu, arrêt propre.`);
  flushStats();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('exit', flushStats);
