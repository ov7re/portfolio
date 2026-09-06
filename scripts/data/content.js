/**
 * Contenus éditoriaux : méthodologie, avantages, à propos, avis, statistiques.
 * Les valeurs chiffrées sont calculées à partir des données réelles du site,
 * jamais saisies à la main.
 */

import { projects } from './projects.js';
import { technologyCount, domainCount } from './technologies.js';

/* ========================= Méthodologie ========================= */
export const processSteps = [
  {
    num: '01',
    title: 'Analyse',
    text: 'Comprendre le besoin réel et définir précisément les fonctionnalités attendues.',
  },
  {
    num: '02',
    title: 'Architecture',
    text: 'Définir la structure technique du projet avant d’écrire la première ligne.',
  },
  {
    num: '03',
    title: 'Développement',
    text: 'Construire le produit avec une architecture propre et maintenable.',
  },
  {
    num: '04',
    title: 'Tests',
    text: 'Tester les fonctionnalités, corriger les problèmes et vérifier les cas limites.',
  },
  {
    num: '05',
    title: 'Livraison',
    text: 'Déployer, transmettre le projet final et sa documentation.',
  },
  {
    num: '06',
    title: 'Maintenance',
    text: 'Assurer les corrections et les évolutions quand le projet doit continuer à vivre.',
  },
];

/* ========================= Avantages ========================= */
export const advantages = [
  {
    icon: 'sparkle',
    title: 'Sur mesure',
    text: 'Chaque projet est développé selon les besoins spécifiques du client, jamais à partir d’un template retouché.',
  },
  {
    icon: 'layers',
    title: 'Full stack',
    text: 'Frontend, backend, base de données et logique serveur pris en charge par le même interlocuteur.',
  },
  {
    icon: 'code',
    title: 'Architecture propre',
    text: 'Code structuré, lisible et maintenable, qui reste modifiable des mois après la livraison.',
  },
  {
    icon: 'message',
    title: 'Communication',
    text: 'Suivi du projet et échanges réguliers pendant toute la durée du développement.',
  },
  {
    icon: 'rocket',
    title: 'Évolutivité',
    text: 'Les projets sont conçus pour pouvoir grandir : ajouter une fonctionnalité ne signifie pas tout reprendre.',
  },
];

/* ========================= À propos ========================= */
/**
 * Le texte de présentation vit dans le HTML (index.html, section #a-propos) :
 * il reste ainsi lisible sans JavaScript et indexable directement.
 * Seules les listes ci-dessous sont générées.
 */
export const about = {
  pills: ['Full Stack', 'Gaming', 'Software', 'Web', 'Database'],
  /** Fiche technique affichée à droite de la section. */
  specs: [
    { key: 'STUDIO', value: 'OV7 Development' },
    { key: 'APPROCHE', value: 'Full stack' },
    { key: 'DOMAINES', value: 'Web · Software · Gaming' },
    { key: 'LANGUES', value: 'Français · Anglais' },
    { key: 'MODÈLE', value: 'Développement sur mesure' },
  ],
};

/* ========================= Avis ========================= */
/**
 * Avis réels uniquement. Un avis inventé se repère et coûte immédiatement
 * la crédibilité que le reste du site cherche à construire.
 *
 *   name  : nom affiché tel quel
 *   role  : ligne secondaire (facultatif)
 *   stars : note de 0 à 5 — mettre 0 pour masquer les étoiles
 *   text  : le texte de l'avis (\n\n pour un nouveau paragraphe)
 */
export const reviews = [
  {
    name: "Paul'",
    role: '',
    stars: 5,
    text:
      'Super prestation réalisée très rapidement. Elle correspond parfaitement à ce que j’attendais, Ov7 a su être flexible quant à mes attentes et mon budget.\n\nJe ne peux que le recommander vivement !',
  },
];

/* ========================= Statistiques ========================= */
/**
 * Aucun chiffre concernant des clients, des années d'expérience ou des
 * projets livrés : uniquement des valeurs vérifiables, calculées à partir
 * des données du site.
 */
export const stats = [
  { value: String(projects.length), label: 'Projets présentés' },
  { value: `${technologyCount}`, label: 'Technologies' },
  { value: String(domainCount), label: 'Domaines couverts' },
  { value: 'Full stack', label: 'Approche' },
];

/* ========================= Tarifs ========================= */
/**
 * Grille indicative affichée dans la section contact.
 * La mention `pricingNotice` est obligatoire : elle évite tout malentendu.
 */
export const pricing = [
  { scope: 'FiveM', from: '50 €', detail: 'Fonctionnalité, script ou système complet' },
  { scope: 'Web', from: '150 €', detail: 'Landing page, site vitrine, dashboard, application' },
  { scope: 'Logiciel', from: '800 €', detail: 'Application desktop ou métier' },
];

export const pricingNotice =
  'Chaque projet étant unique, les tarifs affichés sont indicatifs. Demandez un devis personnalisé.';
