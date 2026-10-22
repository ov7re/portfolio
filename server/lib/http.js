/** Briques HTTP minimales : routeur, lecture du corps, cookies, réponses. */

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class Router {
  #routes = [];

  add(method, pattern, handler, options = {}) {
    const keys = [];
    const regex = new RegExp(
      '^' + pattern.replace(/\/:(\w+)/g, (_, key) => (keys.push(key), '/([^/]+)')) + '/?$'
    );
    this.#routes.push({ method, regex, keys, handler, options });
    return this;
  }

  get(p, h, o) { return this.add('GET', p, h, o); }
  post(p, h, o) { return this.add('POST', p, h, o); }
  put(p, h, o) { return this.add('PUT', p, h, o); }
  patch(p, h, o) { return this.add('PATCH', p, h, o); }
  delete(p, h, o) { return this.add('DELETE', p, h, o); }

  match(method, pathname) {
    let pathMatched = false;
    for (const route of this.#routes) {
      const m = pathname.match(route.regex);
      if (!m) continue;
      pathMatched = true;
      if (route.method !== method) continue;
      const params = {};
      route.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1])));
      return { handler: route.handler, options: route.options, params };
    }
    return pathMatched ? { methodNotAllowed: true } : null;
  }
}

export function sendJson(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

export function sendText(res, status, text, type = 'text/plain; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'Content-Type': type, ...headers });
  res.end(text);
}

export function redirect(res, location, status = 302) {
  res.writeHead(status, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

export function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new HttpError(413, 'Requête trop volumineuse.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export async function readJson(req, limit) {
  const type = req.headers['content-type'] || '';
  if (!type.includes('application/json')) throw new HttpError(415, 'JSON attendu.');
  const text = await readBody(req, limit);
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'JSON invalide.');
  }
}

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    try {
      out[key] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* cookie mal formé : ignoré */
    }
  }
  return out;
}

export function cookie(name, value, { maxAge, httpOnly = true, secure = false, sameSite = 'Lax', path = '/' } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (maxAge !== undefined) parts.push(`Max-Age=${Math.floor(maxAge)}`);
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function appendCookie(res, value) {
  const existing = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', existing ? [].concat(existing, value) : value);
}

/** Adresse réelle du visiteur : le tunnel Cloudflare la transmet dans un en-tête. */
export function clientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Domaine demandé. Volontairement limité à `Host` : un en-tête X-Forwarded-Host
 * fourni par le visiteur permettrait d'atteindre l'administration depuis ov7.fr
 * en contournant la protection Cloudflare Access placée sur admin.ov7.fr.
 */
export function hostOf(req) {
  return String(req.headers.host || '')
    .toLowerCase()
    .replace(/:\d+$/, '');
}
