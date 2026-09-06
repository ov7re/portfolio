/**
 * Options du formulaire de demande de devis.
 * Modifier une option ici suffit : le formulaire et sa validation suivent.
 */

export const projectTypes = [
  { id: 'fivem', label: 'FiveM' },
  { id: 'minecraft', label: 'Minecraft' },
  { id: 'roblox', label: 'Roblox' },
  { id: 'discord', label: 'Discord' },
  { id: 'site-web', label: 'Site web' },
  { id: 'application', label: 'Application' },
  { id: 'logiciel', label: 'Logiciel' },
  { id: 'api', label: 'API' },
  { id: 'autre', label: 'Autre' },
];

export const budgetRanges = [
  { id: 'lt-100', label: '< 100 €' },
  { id: '100-300', label: '100 – 300 €' },
  { id: '300-750', label: '300 – 750 €' },
  { id: '750-1500', label: '750 – 1 500 €' },
  { id: 'gt-1500', label: '1 500 € +' },
  { id: 'a-definir', label: 'À définir' },
];

export const deadlines = [
  { id: 'des-que-possible', label: 'Dès que possible' },
  { id: 'sous-1-mois', label: 'Sous 1 mois' },
  { id: '1-3-mois', label: '1 à 3 mois' },
  { id: 'plus-3-mois', label: 'Plus de 3 mois' },
  { id: 'pas-de-date', label: 'Pas de date fixée' },
];
