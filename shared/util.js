/** Utilitaires partagés : échappement, liens sûrs, mise en forme française. */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** N'accepte que les liens http(s), mailto et les chemins internes. */
export function safeHref(value) {
  const href = String(value ?? '').trim();
  if (!href) return '';
  if (/^(https?:|mailto:)/i.test(href)) return href;
  if (href.startsWith('/') && !href.startsWith('//')) return href;
  return '';
}

/** Texte brut → paragraphes HTML échappés (ligne vide = nouveau paragraphe). */
export function paragraphs(text) {
  return String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function formatDate(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

export function plural(count, singular, pluralForm = singular + 's') {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
