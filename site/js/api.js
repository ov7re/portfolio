/** Client de l'API publique. */

export class MaintenanceError extends Error {}

export async function loadContent() {
  const res = await fetch('/api/public/content', { cache: 'no-store', credentials: 'same-origin' });
  if (res.status === 503) throw new MaintenanceError('maintenance');
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function sendContact(payload) {
  const res = await fetch('/api/public/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Envoi impossible.');
    error.status = res.status;
    error.details = data.details || {};
    throw error;
  }
  return data;
}
