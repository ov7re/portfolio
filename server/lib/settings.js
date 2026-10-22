/** Réglages d'exploitation qui prennent effet immédiatement (hors déploiement). */

import { readJson, writeJson } from './store.js';

const DEFAULTS = {
  maintenance: {
    enabled: false,
    /** true quand la maintenance a été activée automatiquement par une mise à jour. */
    auto: false,
    title: 'Mise à jour en cours',
    message: 'OV7 OS installe une nouvelle version. Le site revient dans quelques instants.',
    eta: '',
    since: null,
  },
};

let settings;

export function initSettings() {
  const stored = readJson('settings.json', {});
  settings = { maintenance: { ...DEFAULTS.maintenance, ...stored.maintenance } };
}

export const getMaintenance = () => settings.maintenance;

export function setMaintenance(patch) {
  const current = settings.maintenance;
  const next = {
    ...current,
    enabled: patch.enabled === undefined ? current.enabled : Boolean(patch.enabled),
    auto: Boolean(patch.auto),
    title: patch.title === undefined ? current.title : String(patch.title).slice(0, 120),
    message: patch.message === undefined ? current.message : String(patch.message).slice(0, 600),
    eta: patch.eta === undefined ? current.eta : String(patch.eta).slice(0, 60),
  };
  if (next.enabled && !current.enabled) next.since = new Date().toISOString();
  if (!next.enabled) next.since = null;
  settings.maintenance = next;
  writeJson('settings.json', settings);
  return next;
}
