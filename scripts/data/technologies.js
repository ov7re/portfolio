/**
 * Technologies utilisées, regroupées par domaine.
 * `mark` est le monogramme affiché dans la carte (2 à 3 caractères).
 */

export const technologyGroups = [
  {
    id: 'frontend',
    label: 'Frontend',
    items: [
      { name: 'HTML', mark: 'HT' },
      { name: 'CSS', mark: 'CS' },
      { name: 'JavaScript', mark: 'JS' },
      { name: 'TypeScript', mark: 'TS' },
      { name: 'React', mark: 'RE' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: [
      { name: 'Node.js', mark: 'ND' },
      { name: 'Python', mark: 'PY' },
      { name: 'API REST', mark: 'API' },
    ],
  },
  {
    id: 'database',
    label: 'Database',
    items: [
      { name: 'PostgreSQL', mark: 'PG' },
      { name: 'MySQL', mark: 'MY' },
      { name: 'SQLite', mark: 'SL' },
    ],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    items: [
      { name: 'Lua', mark: 'LU' },
      { name: 'FiveM', mark: 'FM' },
      { name: 'Minecraft', mark: 'MC' },
      { name: 'Roblox', mark: 'RB' },
      { name: 'Discord', mark: 'DC' },
    ],
  },
  {
    id: 'desktop',
    label: 'Desktop',
    items: [{ name: 'Electron', mark: 'EL' }],
  },
];

/** Nombre total de technologies listées. */
export const technologyCount = technologyGroups.reduce(
  (total, group) => total + group.items.length,
  0
);

/** Nombre de domaines couverts. */
export const domainCount = technologyGroups.length;
