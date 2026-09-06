/**
 * Identité, contacts et liens d'OV7 Development.
 * Fichier unique à modifier pour changer une information globale du site.
 */

export const site = {
  name: 'OV7 Development',
  shortName: 'OV7',
  suffix: 'Development',
  domain: 'ov7.fr',
  url: 'https://ov7.fr',
  signature: 'Transforming ideas into digital solutions.',
  signatureFr: 'Je transforme vos idées en solutions numériques.',
  description:
    'OV7 Development conçoit des sites web, applications, logiciels et systèmes sur mesure.',
  fields: ['Web', 'Software', 'Gaming'],
};

/**
 * Moyens de contact directs. `copy` est la valeur placée dans le presse-papiers.
 * `href` reste optionnel : sans lui, l'élément se contente de copier la valeur.
 */
export const contacts = [
  {
    id: 'email',
    label: 'Email',
    value: 'arthur.calvet@hotmail.com',
    copy: 'arthur.calvet@hotmail.com',
    href: 'mailto:arthur.calvet@hotmail.com',
    icon: 'mail',
  },
  {
    id: 'discord',
    label: 'Discord',
    value: 'user.ov7',
    copy: 'user.ov7',
    href: null,
    icon: 'discord',
  },
];

/**
 * Liens externes affichés dans le footer.
 * N'ajoutez ici qu'un profil qui existe réellement : un lien mort coûte
 * plus de crédibilité qu'un lien absent.
 * (LinkedIn : à ajouter ici dès que le profil professionnel est créé.)
 */
export const socialLinks = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/ov7re' },
];

/**
 * Délai de réponse annoncé sur la page contact.
 * Repris du site précédent : information réelle, à ajuster si besoin.
 */
export const responseTime = 'Réponse habituelle sous 24 à 48 h.';

/**
 * Configuration du formulaire de devis.
 *
 * `endpoint` reste volontairement à `null` : tant qu'aucun backend n'existe,
 * le formulaire valide la saisie puis bascule sur le repli e-mail (mailto).
 *
 * Pour brancher une API plus tard, il suffit de renseigner l'URL ci-dessous :
 *
 *   Frontend  ->  Backend / API  ->  Email · Discord · CRM
 *
 * Ne jamais placer ici une URL de webhook Discord ou une clé d'API : tout ce
 * fichier est public. Le secret reste côté serveur, derrière l'endpoint.
 */
export const formConfig = {
  endpoint: null,
  method: 'POST',
  /** Repli utilisé tant que `endpoint` vaut `null`. */
  fallbackEmail: 'arthur.calvet@hotmail.com',
};

/** Liens de navigation (header, menu mobile et footer). */
export const navLinks = [
  { id: 'accueil', href: '#accueil', label: 'Accueil' },
  { id: 'services', href: '#services', label: 'Services' },
  { id: 'projets', href: '#projets', label: 'Projets' },
  { id: 'technologies', href: '#technologies', label: 'Technologies' },
  { id: 'a-propos', href: '#a-propos', label: 'À propos' },
  { id: 'contact', href: '#contact', label: 'Contact' },
];
