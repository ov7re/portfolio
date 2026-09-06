/**
 * Dictionnaire français.
 *
 * On ne trouve ici que les chaînes générées par le JavaScript : le texte
 * statique des pages reste dans le HTML, qui fait foi en français.
 * Un futur en.js reprendra ces mêmes clés, plus celles utilisées par les
 * attributs `data-i18n` du HTML.
 */

export default {
  common: {
    details: 'Détails',
    viewProject: 'Voir le projet',
    copy: 'Copier',
    copied: 'Copié',
    quote: 'Demander un devis',
    backToProjects: 'Retour aux projets',
  },

  projects: {
    filterLabel: 'Filtrer les projets par catégorie',
    empty: 'Aucun projet ne correspond à ce filtre.',
    countOne: 'projet',
    countMany: 'projets',
  },

  project: {
    overview: 'Présentation',
    problem: 'Problématique',
    solution: 'Solution',
    features: 'Fonctionnalités',
    architecture: 'Architecture',
    tech: 'Technologies',
    screenshots: 'Captures',
    result: 'Résultat',
    previous: 'Projet précédent',
    next: 'Projet suivant',
    notFoundTitle: 'Projet introuvable',
    notFoundText:
      'Ce projet n’existe pas ou n’est plus présenté sur le site. Retrouvez l’ensemble des projets depuis la page d’accueil.',
    ctaTitle: 'Un projet similaire ?',
    ctaText: 'Décrivez votre besoin et recevez une réponse adaptée.',
    sheet: 'Fiche projet',
    category: 'Catégorie',
    status: 'Statut',
    stack: 'Stack',
  },

  form: {
    required: 'Ce champ est obligatoire.',
    invalidEmail: 'Adresse e-mail invalide.',
    tooShort: 'Merci de détailler un peu plus votre projet (30 caractères minimum).',
    selectType: 'Sélectionnez au moins un type de projet.',
    sending: 'Envoi en cours…',
    successApi: 'Demande envoyée. Vous recevrez une réponse sous 24 à 48 h.',
    successMail:
      'Votre message est prêt : votre logiciel de messagerie vient de s’ouvrir avec la demande pré-remplie. Si rien ne s’est passé, écrivez directement à',
    error: 'L’envoi a échoué. Réessayez ou écrivez directement à',
  },

  terminal: {
    hint: 'ov7 — terminal',
    close: 'Fermer le terminal',
  },
};
