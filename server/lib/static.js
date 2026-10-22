/** Service de fichiers statiques avec ETag et protection contre la traversée de dossiers. */

import fs from 'node:fs';
import path from 'node:path';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Chemin absolu sûr à l'intérieur de `root`, ou null. */
export function resolveInside(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const file = path.resolve(root, '.' + path.posix.normalize('/' + decoded));
  return file === root || file.startsWith(root + path.sep) ? file : null;
}

/**
 * Sert `urlPath` depuis `root` si le fichier existe. Renvoie false sinon,
 * pour laisser l'appelant décider (page applicative, 404…).
 */
export function serveFile(req, res, root, urlPath, { maxAge = 300 } = {}) {
  const file = resolveInside(root, urlPath);
  if (!file) return false;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;

  const etag = `W/"${stat.size.toString(36)}-${stat.mtimeMs.toString(36)}"`;
  const ext = path.extname(file).toLowerCase();
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : `public, max-age=${maxAge}, must-revalidate`,
    ETag: etag,
  };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    res.end();
    return true;
  }
  res.writeHead(200, { ...headers, 'Content-Length': stat.size });
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(file).pipe(res);
  return true;
}
