/** Client de l'API d'administration. */

const listeners = new Set();

/** Prévient l'application quand la session expire (réponse 401). */
export function onUnauthorized(fn) {
  listeners.add(fn);
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api/admin${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        'X-OV7': '1',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable. Vérifiez la connexion du NAS.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') for (const fn of listeners) fn();
  if (!res.ok) throw new ApiError(res.status, data.error || `Erreur ${res.status}`, data.details);
  return data;
}

export const get = (path) => api(path);
export const post = (path, body = {}) => api(path, { method: 'POST', body });
export const put = (path, body) => api(path, { method: 'PUT', body });
export const patch = (path, body) => api(path, { method: 'PATCH', body });
export const del = (path) => api(path, { method: 'DELETE' });
