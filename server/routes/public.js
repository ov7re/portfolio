/** API publique, consommée par le site (OV7 OS). */

import { getDraft, getLive, publicView } from '../lib/content.js';
import { HttpError, readJson, redirect, appendCookie, cookie } from '../lib/http.js';
import { createMessage } from '../lib/messages.js';
import { createLimiter } from '../lib/ratelimit.js';
import { getMaintenance } from '../lib/settings.js';

const contactLimiter = createLimiter({ windowMs: 10 * 60_000, max: 3 });

export function publicRoutes(router) {
  router.get('/api/public/content', ({ preview }) => {
    if (getMaintenance().enabled && !preview) throw new HttpError(503, 'Maintenance en cours.', { maintenance: true });
    const live = getLive();
    return {
      preview,
      version: live.release.version,
      deployedAt: live.release.createdAt,
      content: publicView(preview ? getDraft() : live.content),
    };
  });

  router.get('/api/public/status', ({ preview }) => {
    const maintenance = getMaintenance();
    return { maintenance: maintenance.enabled && !preview, version: getLive().release.version };
  });

  router.post('/api/public/contact', async ({ req, ip }) => {
    if (getMaintenance().enabled) throw new HttpError(503, 'Maintenance en cours.');
    const body = await readJson(req, 20_000);
    // Champ piège invisible pour les humains : un robot qui le remplit reçoit
    // une réponse positive, mais rien n'est enregistré.
    if (body.website) return { ok: true };
    const wait = contactLimiter.hit(ip);
    if (wait) throw new HttpError(429, `Trop de messages envoyés. Réessayez dans ${Math.ceil(wait / 60)} min.`);
    createMessage(body, getLive().content.contact);
    return { ok: true, message: getLive().content.contact.successMessage };
  });

  router.get('/api/public/preview/exit', ({ res }) => {
    appendCookie(res, cookie('ov7_preview', '', { maxAge: 0 }));
    redirect(res, '/');
  });
}
