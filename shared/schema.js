/**
 * Schéma du contenu du site.
 *
 * Une seule source de vérité, utilisée des deux côtés :
 *   - le logiciel d'administration génère ses formulaires à partir des champs ;
 *   - l'API nettoie chaque enregistrement avec `sanitizeSection` avant de
 *     l'écrire, ce qui garantit au site une forme de données toujours valide.
 *
 * Types de champ : text, textarea, email, url, image, color, select, icon,
 * number, stars, toggle, tags, lines, multi, slug, date, group, list.
 */

import { ICON_CHOICES } from './icons.js';
import { slugify, safeHref } from './util.js';

export const TONES = [
  { value: 'ember', label: 'Braise' },
  { value: 'ocean', label: 'Océan' },
  { value: 'violet', label: 'Violet' },
  { value: 'emerald', label: 'Émeraude' },
  { value: 'gold', label: 'Or' },
  { value: 'slate', label: 'Ardoise' },
];

export const WALLPAPERS = [
  { value: 'ember', label: 'Braise' },
  { value: 'aurora', label: 'Aurore' },
  { value: 'blueprint', label: 'Plan technique' },
  { value: 'mono', label: 'Monochrome' },
];

export const SECTIONS = [
  {
    key: 'identity',
    label: 'Identité',
    icon: 'user',
    description: 'Nom, accroche, coordonnées et disponibilité affichés partout sur le site.',
    fields: [
      { key: 'name', label: 'Nom du studio', type: 'text', default: 'OV7 Development' },
      { key: 'shortName', label: 'Nom court', type: 'text', default: 'OV7', max: 12 },
      { key: 'owner', label: 'Nom affiché du développeur', type: 'text', help: 'Facultatif. Laissé vide, seul le nom du studio apparaît.' },
      { key: 'role', label: 'Titre', type: 'text', default: 'Développeur full stack' },
      { key: 'tagline', label: 'Accroche', type: 'text' },
      { key: 'description', label: 'Description (référencement)', type: 'textarea', rows: 3, max: 300, help: 'Reprise dans les résultats Google et les aperçus de liens.' },
      { key: 'location', label: 'Localisation', type: 'text', help: 'Facultatif.' },
      {
        key: 'availability', label: 'Disponibilité', type: 'select', default: 'open',
        options: [
          { value: 'open', label: 'Disponible' },
          { value: 'limited', label: 'Disponibilité limitée' },
          { value: 'closed', label: 'Complet' },
        ],
      },
      { key: 'availabilityLabel', label: 'Texte de disponibilité', type: 'text' },
      { key: 'responseTime', label: 'Délai de réponse annoncé', type: 'text' },
      { key: 'email', label: 'E-mail de contact', type: 'email' },
      { key: 'discord', label: 'Pseudo Discord', type: 'text' },
    ],
  },
  {
    key: 'about',
    label: 'À propos',
    icon: 'file',
    description: 'Présentation, fiche studio et points forts.',
    fields: [
      { key: 'headline', label: 'Titre', type: 'text' },
      { key: 'intro', label: 'Présentation', type: 'textarea', rows: 7, help: 'Une ligne vide sépare deux paragraphes.' },
      { key: 'pills', label: 'Mots-clés', type: 'tags' },
      {
        key: 'specs', label: 'Fiche studio', type: 'list', itemLabel: (i) => i.key || 'Ligne',
        fields: [
          { key: 'key', label: 'Libellé', type: 'text' },
          { key: 'value', label: 'Valeur', type: 'text' },
        ],
      },
      {
        key: 'advantages', label: 'Points forts', type: 'list', itemLabel: (i) => i.title || 'Point fort',
        fields: [
          { key: 'icon', label: 'Icône', type: 'icon', default: 'sparkle' },
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'text', label: 'Texte', type: 'textarea', rows: 2 },
        ],
      },
    ],
  },
  {
    key: 'process',
    label: 'Méthode',
    icon: 'layers',
    description: 'Les étapes d’un projet, de l’analyse à la maintenance.',
    fields: [
      { key: 'intro', label: 'Introduction', type: 'textarea', rows: 2 },
      {
        key: 'steps', label: 'Étapes', type: 'list', itemLabel: (i) => i.title || 'Étape',
        fields: [
          { key: 'title', label: 'Titre', type: 'text' },
          { key: 'text', label: 'Texte', type: 'textarea', rows: 2 },
        ],
      },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    icon: 'briefcase',
    description: 'Pôles d’activité et prestations proposées.',
    fields: [
      { key: 'intro', label: 'Introduction', type: 'textarea', rows: 2 },
      {
        key: 'poles', label: 'Pôles', type: 'list', itemLabel: (i) => i.title || 'Pôle',
        fields: [
          { key: 'title', label: 'Nom du pôle', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
          {
            key: 'services', label: 'Prestations', type: 'list', itemLabel: (i) => i.title || 'Prestation',
            fields: [
              { key: 'icon', label: 'Icône', type: 'icon', default: 'code' },
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'text', label: 'Description', type: 'textarea', rows: 2 },
              { key: 'items', label: 'Détails', type: 'tags' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'projects',
    label: 'Projets',
    icon: 'folder',
    description: 'Les réalisations affichées dans l’explorateur de projets.',
    fields: [
      {
        key: 'categories', label: 'Catégories', type: 'list', itemLabel: (i) => i.label || 'Catégorie',
        fields: [
          { key: 'id', label: 'Identifiant', type: 'slug', from: 'label' },
          { key: 'label', label: 'Libellé', type: 'text' },
        ],
      },
      {
        key: 'items', label: 'Projets', type: 'list', itemLabel: (i) => (i.hidden ? '⦸ ' : '') + (i.name || 'Nouveau projet'),
        fields: [
          { key: 'name', label: 'Nom', type: 'text' },
          { key: 'id', label: 'Adresse (URL)', type: 'slug', from: 'name', help: 'ov7.fr/projets/<adresse>. Générée depuis le nom si vide.' },
          { key: 'hidden', label: 'Masquer sur le site', type: 'toggle' },
          { key: 'featured', label: 'Mettre en avant', type: 'toggle' },
          { key: 'categories', label: 'Catégories', type: 'multi', optionsFrom: (root) => (root.categories || []).map((c) => ({ value: c.id, label: c.label })) },
          { key: 'status', label: 'État du projet', type: 'text' },
          { key: 'year', label: 'Année', type: 'text', max: 9 },
          { key: 'icon', label: 'Icône', type: 'icon', default: 'folder' },
          { key: 'tone', label: 'Couleur', type: 'select', options: TONES, default: 'ember' },
          { key: 'cover', label: 'Image de couverture', type: 'image', help: 'Facultatif : sans image, une couverture est générée.' },
          { key: 'summary', label: 'Résumé', type: 'textarea', rows: 2, max: 400 },
          { key: 'presentation', label: 'Présentation', type: 'textarea', rows: 4 },
          { key: 'problem', label: 'Le besoin', type: 'textarea', rows: 3 },
          { key: 'solution', label: 'La solution', type: 'textarea', rows: 3 },
          { key: 'features', label: 'Fonctionnalités', type: 'lines', help: 'Une fonctionnalité par ligne.' },
          {
            key: 'architecture', label: 'Architecture', type: 'list', itemLabel: (i) => i.title || 'Étape',
            fields: [
              { key: 'title', label: 'Titre', type: 'text' },
              { key: 'text', label: 'Texte', type: 'textarea', rows: 2 },
            ],
          },
          { key: 'tech', label: 'Technologies', type: 'tags' },
          { key: 'result', label: 'Résultat', type: 'textarea', rows: 2 },
          { key: 'note', label: 'Note (encart)', type: 'textarea', rows: 2 },
          {
            key: 'links', label: 'Liens', type: 'list', itemLabel: (i) => i.label || 'Lien',
            fields: [
              { key: 'label', label: 'Libellé', type: 'text' },
              { key: 'href', label: 'Adresse', type: 'url' },
            ],
          },
          {
            key: 'screenshots', label: 'Captures', type: 'list', itemLabel: (i) => i.caption || 'Capture',
            fields: [
              { key: 'src', label: 'Image', type: 'image' },
              { key: 'caption', label: 'Légende', type: 'text' },
            ],
          },
        ],
      },
    ],
    finalize(value) {
      value.categories = uniqueIds(value.categories, 'label');
      const known = new Set(value.categories.map((c) => c.id));
      value.items = uniqueIds(value.items, 'name').map((p) => ({
        ...p,
        categories: p.categories.filter((c) => known.has(c)),
      }));
    },
  },
  {
    key: 'technologies',
    label: 'Stack',
    icon: 'chip',
    description: 'Technologies maîtrisées, regroupées par domaine.',
    fields: [
      {
        key: 'groups', label: 'Domaines', type: 'list', itemLabel: (i) => i.label || 'Domaine',
        fields: [
          { key: 'label', label: 'Domaine', type: 'text' },
          {
            key: 'items', label: 'Technologies', type: 'list', itemLabel: (i) => i.name || 'Technologie',
            fields: [
              { key: 'name', label: 'Nom', type: 'text' },
              { key: 'mark', label: 'Monogramme', type: 'text', max: 3, help: '2 ou 3 caractères.' },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 'reviews',
    label: 'Avis clients',
    icon: 'star',
    description: 'Témoignages affichés dans l’application Avis. Avis réels uniquement.',
    fields: [
      {
        key: 'items', label: 'Avis', type: 'list', addLabel: 'Ajouter un avis', newFirst: true,
        itemLabel: (i) => `${i.hidden ? '⦸ ' : ''}${i.name || 'Nouvel avis'}${i.rating ? ' — ' + '★'.repeat(i.rating) : ''}`,
        fields: [
          { key: 'name', label: 'Nom du client', type: 'text' },
          { key: 'role', label: 'Rôle / entreprise', type: 'text' },
          { key: 'rating', label: 'Note', type: 'stars', min: 0, max: 5, default: 5 },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'project', label: 'Projet concerné', type: 'text' },
          { key: 'text', label: 'Avis', type: 'textarea', rows: 5 },
          { key: 'hidden', label: 'Masquer sur le site', type: 'toggle' },
        ],
      },
    ],
  },
  {
    key: 'pricing',
    label: 'Tarifs',
    icon: 'euro',
    description: 'Grille indicative affichée dans l’application Contact.',
    fields: [
      {
        key: 'items', label: 'Tarifs', type: 'list', itemLabel: (i) => `${i.scope || 'Tarif'}${i.from ? ' — ' + i.from : ''}`,
        fields: [
          { key: 'scope', label: 'Domaine', type: 'text' },
          { key: 'from', label: 'À partir de', type: 'text' },
          { key: 'detail', label: 'Détail', type: 'text' },
        ],
      },
      { key: 'notice', label: 'Mention', type: 'textarea', rows: 2 },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: 'mail',
    description: 'Formulaire de demande de devis.',
    fields: [
      { key: 'intro', label: 'Introduction', type: 'textarea', rows: 2 },
      { key: 'projectTypes', label: 'Types de projet', type: 'tags' },
      { key: 'budgets', label: 'Budgets', type: 'tags' },
      { key: 'deadlines', label: 'Délais', type: 'tags' },
      { key: 'successMessage', label: 'Message après envoi', type: 'textarea', rows: 2 },
    ],
  },
  {
    key: 'socials',
    label: 'Réseaux',
    icon: 'link',
    description: 'Profils externes (GitHub, LinkedIn…). Uniquement des profils qui existent.',
    fields: [
      {
        key: 'links', label: 'Liens', type: 'list', itemLabel: (i) => i.label || 'Lien',
        fields: [
          { key: 'label', label: 'Nom', type: 'text' },
          { key: 'icon', label: 'Icône', type: 'icon', default: 'link' },
          { key: 'href', label: 'Adresse', type: 'url' },
        ],
      },
    ],
  },
  {
    key: 'legal',
    label: 'Mentions légales',
    icon: 'shield',
    description: 'Mentions légales et politique de confidentialité. Tant que le nom de l’éditeur est vide, la page n’est pas affichée sur le site.',
    fields: [
      { key: 'editor', label: 'Éditeur du site', type: 'text', help: 'Nom et prénom, ou raison sociale. Obligatoire pour afficher la page.' },
      { key: 'status', label: 'Statut', type: 'text', help: 'Ex. : Entrepreneur individuel (micro-entreprise).' },
      { key: 'siren', label: 'SIREN / SIRET', type: 'text', max: 20, help: 'Obligatoire si l’activité est immatriculée.' },
      { key: 'address', label: 'Adresse', type: 'textarea', rows: 2 },
      { key: 'phone', label: 'Téléphone', type: 'text', max: 30 },
      { key: 'email', label: 'E-mail', type: 'email', help: 'Laissé vide, l’e-mail de contact de la section Identité est utilisé.' },
      { key: 'director', label: 'Directeur de la publication', type: 'text', help: 'Laissé vide, l’éditeur est indiqué.' },
      {
        key: 'host', label: 'Hébergement', type: 'textarea', rows: 3,
        default: 'Le site est hébergé par l’éditeur, sur un serveur situé en France.\nLe trafic transite par Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis (cloudflare.com).',
      },
      { key: 'messagesRetention', label: 'Conservation des messages (mois)', type: 'number', min: 1, max: 120, default: 36, help: 'Les messages du formulaire plus anciens sont supprimés automatiquement.' },
      { key: 'discord', label: 'Notifications Discord activées', type: 'toggle', help: 'À cocher si DISCORD_WEBHOOK_URL est renseigné sur le serveur : la politique le mentionne alors.' },
      { key: 'extra', label: 'Précisions complémentaires', type: 'textarea', rows: 3, help: 'Facultatif, ajouté en fin de politique de confidentialité.' },
      { key: 'updatedAt', label: 'Date de mise à jour', type: 'date' },
    ],
  },
  {
    key: 'os',
    label: 'Système OV7 OS',
    icon: 'palette',
    description: 'Apparence du faux système d’exploitation : fond d’écran, couleur, démarrage, terminal.',
    fields: [
      { key: 'osName', label: 'Nom du système', type: 'text', default: 'OV7 OS' },
      { key: 'wallpaper', label: 'Fond d’écran par défaut', type: 'select', options: WALLPAPERS, default: 'ember' },
      { key: 'accent', label: 'Couleur d’accent', type: 'color', default: '#ff5a1f' },
      {
        key: 'theme', label: 'Thème par défaut', type: 'select', default: 'dark',
        options: [{ value: 'dark', label: 'Sombre' }, { value: 'light', label: 'Clair' }],
      },
      { key: 'boot', label: 'Écran de démarrage', type: 'toggle', default: true, help: 'Affiché une fois par visite.' },
      { key: 'bootLines', label: 'Lignes du démarrage', type: 'lines' },
      { key: 'welcomeTitle', label: 'Titre du widget d’accueil', type: 'text' },
      { key: 'welcomeText', label: 'Texte du widget d’accueil', type: 'textarea', rows: 3 },
      { key: 'motd', label: 'Message du terminal', type: 'textarea', rows: 3 },
      { key: 'trash', label: 'Afficher la corbeille (easter egg)', type: 'toggle', default: true },
    ],
  },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key);

export function getSection(key) {
  return SECTIONS.find((s) => s.key === key) || null;
}

/* ------------------------------------------------------------------ */
/* Nettoyage                                                          */
/* ------------------------------------------------------------------ */

const TEXT_LIMITS = { text: 300, email: 200, date: 10, textarea: 10000, url: 2000, image: 2000 };

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function sanitizeValue(field, value) {
  switch (field.type) {
    case 'toggle':
      return value === undefined ? Boolean(field.default) : Boolean(value);
    case 'number':
    case 'stars': {
      let n = Number(value);
      if (value === undefined || value === '' || !Number.isFinite(n)) n = field.default ?? 0;
      if (field.min !== undefined) n = Math.max(field.min, n);
      if (field.max !== undefined) n = Math.min(field.max, n);
      return field.type === 'stars' ? Math.round(n) : n;
    }
    case 'tags':
    case 'lines':
      return (Array.isArray(value) ? value : [])
        .map((s) => String(s ?? '').trim().slice(0, 600))
        .filter(Boolean)
        .slice(0, field.maxItems ?? 100);
    case 'multi':
      return [...new Set((Array.isArray(value) ? value : []).map(slugify).filter(Boolean))].slice(0, 30);
    case 'list':
      return (Array.isArray(value) ? value : [])
        .filter(isObject)
        .slice(0, field.maxItems ?? 300)
        .map((item) => sanitizeFields(field.fields, item));
    case 'group':
      return sanitizeFields(field.fields, value);
    case 'select': {
      const values = field.options.map((o) => o.value);
      return values.includes(value) ? value : field.default ?? values[0];
    }
    case 'icon':
      return ICON_CHOICES.includes(value) ? value : field.default ?? 'file';
    case 'color':
      return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value).toLowerCase() : field.default ?? '#ff5a1f';
    case 'slug':
      return slugify(value);
    case 'url':
    case 'image':
      return safeHref(String(value ?? '').slice(0, TEXT_LIMITS[field.type]));
    default: {
      const raw = value === undefined || value === null ? field.default ?? '' : value;
      const limit = field.max ?? TEXT_LIMITS[field.type] ?? 300;
      const text = String(raw).replace(/\r\n/g, '\n').slice(0, limit);
      return field.type === 'textarea' ? text : text.trim();
    }
  }
}

export function sanitizeFields(fields, source) {
  const src = isObject(source) ? source : {};
  const out = {};
  for (const field of fields) out[field.key] = sanitizeValue(field, src[field.key]);
  return out;
}

export function sanitizeSection(key, value) {
  const section = getSection(key);
  if (!section) throw new Error(`Section inconnue : ${key}`);
  const clean = sanitizeFields(section.fields, value);
  section.finalize?.(clean);
  return clean;
}

export function sanitizeContent(content) {
  const out = {};
  for (const key of SECTION_KEYS) out[key] = sanitizeSection(key, content?.[key]);
  return out;
}

/** Valeur par défaut d'un nouvel élément de liste. */
export function emptyItem(field) {
  return sanitizeFields(field.fields, {});
}

/** Complète les identifiants manquants et supprime les doublons (-2, -3…). */
function uniqueIds(items, fromKey) {
  const seen = new Set();
  return items.map((item) => {
    let base = item.id || slugify(item[fromKey]) || 'element';
    let id = base;
    let n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.add(id);
    return { ...item, id };
  });
}
