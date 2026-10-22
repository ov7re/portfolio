/**
 * Configuration lue dans l'environnement (fichier .env à la racine en local,
 * `env_file` dans Docker). Voir .env.example pour la liste commentée.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

loadDotEnv(path.join(ROOT, '.env'));

const env = process.env;
const list = (value) => String(value || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const bool = (value, fallback) => (value === undefined || value === '' ? fallback : /^(1|true|yes|on)$/i.test(value));

const production = env.NODE_ENV === 'production';

export const config = {
  production,
  port: Number(env.PORT || 8080),
  host: env.HOST || '0.0.0.0',

  dataDir: path.resolve(ROOT, env.DATA_DIR || 'data'),
  siteDir: path.join(ROOT, 'site'),
  adminDir: path.join(ROOT, 'admin'),
  sharedDir: path.join(ROOT, 'shared'),

  /** Adresse publique du site, utilisée pour les liens absolus (SEO, aperçu). */
  siteUrl: (env.SITE_URL || 'http://localhost:8080').replace(/\/$/, ''),
  /** Domaines qui servent le logiciel d'administration. */
  adminHosts: list(env.ADMIN_HOSTS || 'admin.ov7.fr,admin.localhost'),

  adminUser: env.ADMIN_USER || 'admin',
  adminPassword: env.ADMIN_PASSWORD || '',
  secureCookies: bool(env.SECURE_COOKIES, production),
  sessionDays: Number(env.SESSION_DAYS || 7),

  discordWebhook: env.DISCORD_WEBHOOK_URL || '',

  updates: {
    enabled: bool(env.UPDATES_ENABLED, false),
    repoDir: path.resolve(ROOT, env.REPO_DIR || '.'),
    remote: env.UPDATE_REMOTE || 'origin',
    branch: env.UPDATE_BRANCH || 'main',
    /** Quitte le processus après une mise à jour : Docker le relance aussitôt. */
    restart: bool(env.RESTART_ON_UPDATE, production),
  },
};

function loadDotEnv(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match || line.trim().startsWith('#')) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.replace(/^(['"])(.*)\1$/, '$2');
  }
}
