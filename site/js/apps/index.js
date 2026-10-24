/** Registre des applications d'OV7 OS, dans l'ordre du bureau. */

import about from './about.js';
import contact from './contact.js';
import legal from './legal.js';
import projects from './projects.js';
import reviews from './reviews.js';
import services from './services.js';
import settings from './settings.js';
import stack from './stack.js';
import terminal from './terminal.js';
import trash from './trash.js';

const ALL = [projects, about, services, stack, reviews, contact, terminal, settings, trash, legal];

/** Applications disponibles selon le contenu publié. */
export function availableApps(content) {
  return ALL.filter((app) => {
    if (app.id === 'reviews') return content.reviews.items.length > 0;
    if (app.id === 'trash') return content.os.trash;
    if (app.id === 'legal') return Boolean(content.legal.editor);
    return true;
  }).map((app) => ({ ...app, path: `/${app.route}` }));
}

/** Applications épinglées dans la barre des tâches (et le dock mobile). */
export const PINNED = ['projects', 'about', 'services', 'contact', 'terminal'];
export const PINNED_MOBILE = ['projects', 'about', 'services', 'contact'];
