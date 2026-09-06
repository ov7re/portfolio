/**
 * Les deux pôles d'activité et les prestations associées.
 * `icon` renvoie à une clé de scripts/lib/icons.js.
 */

export const servicePoles = [
  {
    id: 'gaming',
    index: '01',
    title: 'Gaming Development',
    description:
      'Développement de systèmes et de solutions personnalisées pour les plateformes gaming et les communautés.',
    services: [
      {
        id: 'fivem',
        icon: 'gamepad',
        title: 'FiveM',
        text: 'Scripts et systèmes complets, du script isolé à l’architecture serveur entière.',
        items: ['Scripts Lua', 'NUI', 'ESX', 'oxmysql', 'ox_inventory', 'Systèmes complexes'],
      },
      {
        id: 'minecraft',
        icon: 'cube',
        title: 'Minecraft',
        text: 'Plugins et fonctionnalités serveur conçus pour votre configuration.',
        items: ['Plugins', 'Systèmes serveur', 'Fonctionnalités sur mesure', 'Intégrations'],
      },
      {
        id: 'roblox',
        icon: 'blocks',
        title: 'Roblox',
        text: 'Systèmes de gameplay, interfaces et logique serveur pour vos expériences.',
        items: ['Systèmes gameplay', 'Interfaces', 'Scripts', 'Backend'],
      },
      {
        id: 'discord',
        icon: 'discord',
        title: 'Discord',
        text: 'Bots et outils d’automatisation pour faire tourner une communauté sans la surveiller en permanence.',
        items: ['Bots', 'Automatisation', 'APIs', 'Modération', 'Tickets', 'Dashboards'],
      },
    ],
  },
  {
    id: 'software',
    index: '02',
    title: 'Software Development',
    description:
      'Conception d’applications, de plateformes et de logiciels métier, du frontend à la base de données.',
    services: [
      {
        id: 'web',
        icon: 'globe',
        title: 'Web',
        text: 'Du site vitrine à la plateforme métier, pensés pour rester rapides et lisibles.',
        items: ['Sites vitrines', 'Plateformes', 'Dashboards', 'Applications web'],
      },
      {
        id: 'applications',
        icon: 'window',
        title: 'Applications',
        text: 'Applications desktop et mobiles, y compris pour un usage interne à une équipe.',
        items: ['Desktop', 'Mobile', 'Applications métier'],
      },
      {
        id: 'backend',
        icon: 'server',
        title: 'Backend',
        text: 'APIs, authentification et architecture serveur, conçues pour durer.',
        items: ['APIs REST', 'Authentification', 'Architecture serveur', 'Intégrations'],
      },
      {
        id: 'database',
        icon: 'database',
        title: 'Database',
        text: 'Conception de schémas et optimisation des accès aux données.',
        items: ['PostgreSQL', 'MySQL', 'SQLite', 'Conception de schémas', 'Optimisation'],
      },
    ],
  },
];
