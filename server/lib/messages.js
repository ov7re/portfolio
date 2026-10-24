/** Messages reçus par le formulaire de contact du site. */

import crypto from 'node:crypto';
import { config } from '../config.js';
import { getLive } from './content.js';
import { HttpError } from './http.js';
import { readJson, writeJson } from './store.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (value, max) => String(value ?? '').trim().slice(0, max);

/** Liste les messages, après suppression de ceux qui dépassent la durée de
 *  conservation annoncée dans la politique de confidentialité. */
export function listMessages() {
  const all = readJson('messages.json', []);
  const months = getLive().content.legal.messagesRetention;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const kept = all.filter((m) => new Date(m.createdAt) >= cutoff);
  if (kept.length !== all.length) writeJson('messages.json', kept);
  return kept;
}

/** Purge au démarrage puis une fois par jour, même sans visite du logiciel. */
export function initMessages() {
  listMessages();
  setInterval(listMessages, 86_400_000).unref();
}

export function unreadCount() {
  return listMessages().filter((m) => !m.read).length;
}

export function createMessage(input, allowed) {
  const message = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
    name: clip(input.name, 80),
    email: clip(input.email, 200),
    type: clip(input.type, 60),
    budget: clip(input.budget, 60),
    deadline: clip(input.deadline, 60),
    message: clip(input.message, 5000),
  };

  const errors = {};
  if (message.name.length < 2) errors.name = 'Indiquez votre nom.';
  if (!EMAIL.test(message.email)) errors.email = 'Adresse e-mail invalide.';
  if (message.message.length < 20) errors.message = 'Décrivez votre projet en quelques phrases (20 caractères minimum).';
  if (message.type && !allowed.projectTypes.includes(message.type)) message.type = '';
  if (message.budget && !allowed.budgets.includes(message.budget)) message.budget = '';
  if (message.deadline && !allowed.deadlines.includes(message.deadline)) message.deadline = '';
  if (Object.keys(errors).length) throw new HttpError(422, 'Certains champs sont invalides.', errors);

  const all = listMessages();
  all.unshift(message);
  writeJson('messages.json', all.slice(0, 2000));
  notifyDiscord(message);
  return message;
}

export function updateMessage(id, patch) {
  const all = listMessages();
  const message = all.find((m) => m.id === id);
  if (!message) throw new HttpError(404, 'Message introuvable.');
  if (patch.read !== undefined) message.read = Boolean(patch.read);
  writeJson('messages.json', all);
  return message;
}

export function deleteMessage(id) {
  const all = listMessages();
  const next = all.filter((m) => m.id !== id);
  if (next.length === all.length) throw new HttpError(404, 'Message introuvable.');
  writeJson('messages.json', next);
}

/** Notification facultative (DISCORD_WEBHOOK_URL). Un échec n'affecte pas l'envoi. */
function notifyDiscord(message) {
  if (!config.discordWebhook) return;
  const fields = [
    ['E-mail', message.email],
    ['Type', message.type],
    ['Budget', message.budget],
    ['Délai', message.deadline],
  ]
    .filter(([, v]) => v)
    .map(([name, value]) => ({ name, value, inline: true }));

  fetch(config.discordWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'OV7 OS',
      allowed_mentions: { parse: [] },
      embeds: [{
        title: `Nouveau message — ${message.name}`.slice(0, 250),
        description: message.message.slice(0, 3500),
        color: 0xff5a1f,
        fields,
        timestamp: message.createdAt,
      }],
    }),
    signal: AbortSignal.timeout(8000),
  }).catch((error) => console.warn('[discord] notification échouée :', error.message));
}
