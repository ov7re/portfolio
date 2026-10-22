/** État partagé du logiciel (contenu, modifications en attente, compteurs). */

import { get } from './api.js';

export const store = {
  session: null,
  draft: null,
  live: null,
  release: null,
  pending: [],
  unread: 0,
  maintenance: false,
};

const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function update(patch) {
  Object.assign(store, patch);
  for (const fn of subscribers) fn(store);
}

export async function refreshContent() {
  const data = await get('/content');
  update({ draft: data.draft, live: data.live, release: data.release, pending: data.pending });
}

export async function refreshCounters() {
  const data = await get('/dashboard');
  update({ unread: data.messages.unread, maintenance: data.maintenance.enabled, pending: data.pending, release: data.release });
  return data;
}
