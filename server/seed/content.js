/**
 * Contenu initial, repris de l'ancien site.
 * Utilisé une seule fois, au premier démarrage, quand aucun brouillon n'existe :
 * ensuite tout se modifie depuis le logiciel.
 */

export const seedContent = {
  identity: {
    name: 'OV7 Development',
    shortName: 'OV7',
    owner: '',
    role: 'Studio de développement full stack',
    tagline: 'Je transforme vos idées en solutions numériques.',
    description:
      'OV7 Development conçoit des sites web, applications, logiciels et systèmes sur mesure — Web, Software & Gaming.',
    location: '',
    availability: 'open',
    availabilityLabel: 'Disponible pour de nouveaux projets',
    responseTime: 'Réponse habituelle sous 24 à 48 h.',
    email: 'arthur.calvet@hotmail.com',
    discord: 'user.ov7',
  },

  about: {
    headline: 'À propos d’OV7',
    intro:
      'OV7 Development est un studio de développement indépendant spécialisé dans la conception de solutions numériques sur mesure.\n\nL’objectif est de transformer des besoins concrets en produits fonctionnels, performants et maintenables, avec une approche allant de l’architecture au développement et à la mise en production.',
    pills: ['Full Stack', 'Gaming', 'Software', 'Web', 'Database'],
    specs: [
      { key: 'Studio', value: 'OV7 Development' },
      { key: 'Approche', value: 'Full stack' },
      { key: 'Domaines', value: 'Web · Software · Gaming' },
      { key: 'Langues', value: 'Français · Anglais' },
      { key: 'Modèle', value: 'Développement sur mesure' },
    ],
    advantages: [
      { icon: 'sparkle', title: 'Sur mesure', text: 'Chaque projet est développé selon les besoins spécifiques du client, jamais à partir d’un template retouché.' },
      { icon: 'layers', title: 'Full stack', text: 'Frontend, backend, base de données et logique serveur pris en charge par le même interlocuteur.' },
      { icon: 'code', title: 'Architecture propre', text: 'Code structuré, lisible et maintenable, qui reste modifiable des mois après la livraison.' },
      { icon: 'message', title: 'Communication', text: 'Suivi du projet et échanges réguliers pendant toute la durée du développement.' },
      { icon: 'rocket', title: 'Évolutivité', text: 'Les projets sont conçus pour pouvoir grandir : ajouter une fonctionnalité ne signifie pas tout reprendre.' },
    ],
  },

  process: {
    intro: 'Six étapes, toujours les mêmes, pour qu’un projet avance sans surprise.',
    steps: [
      { title: 'Analyse', text: 'Comprendre le besoin réel et définir précisément les fonctionnalités attendues.' },
      { title: 'Architecture', text: 'Définir la structure technique du projet avant d’écrire la première ligne.' },
      { title: 'Développement', text: 'Construire le produit avec une architecture propre et maintenable.' },
      { title: 'Tests', text: 'Tester les fonctionnalités, corriger les problèmes et vérifier les cas limites.' },
      { title: 'Livraison', text: 'Déployer, transmettre le projet final et sa documentation.' },
      { title: 'Maintenance', text: 'Assurer les corrections et les évolutions quand le projet doit continuer à vivre.' },
    ],
  },

  services: {
    intro: 'Deux pôles, un même interlocuteur : du script de jeu à la plateforme métier.',
    poles: [
      {
        title: 'Gaming Development',
        description: 'Développement de systèmes et de solutions personnalisées pour les plateformes gaming et les communautés.',
        services: [
          { icon: 'gamepad', title: 'FiveM', text: 'Scripts et systèmes complets, du script isolé à l’architecture serveur entière.', items: ['Scripts Lua', 'NUI', 'ESX', 'oxmysql', 'ox_inventory', 'Systèmes complexes'] },
          { icon: 'cube', title: 'Minecraft', text: 'Plugins et fonctionnalités serveur conçus pour votre configuration.', items: ['Plugins', 'Systèmes serveur', 'Fonctionnalités sur mesure', 'Intégrations'] },
          { icon: 'blocks', title: 'Roblox', text: 'Systèmes de gameplay, interfaces et logique serveur pour vos expériences.', items: ['Systèmes gameplay', 'Interfaces', 'Scripts', 'Backend'] },
          { icon: 'discord', title: 'Discord', text: 'Bots et outils d’automatisation pour faire tourner une communauté sans la surveiller en permanence.', items: ['Bots', 'Automatisation', 'APIs', 'Modération', 'Tickets', 'Dashboards'] },
        ],
      },
      {
        title: 'Software Development',
        description: 'Conception d’applications, de plateformes et de logiciels métier, du frontend à la base de données.',
        services: [
          { icon: 'globe', title: 'Web', text: 'Du site vitrine à la plateforme métier, pensés pour rester rapides et lisibles.', items: ['Sites vitrines', 'Plateformes', 'Dashboards', 'Applications web'] },
          { icon: 'window', title: 'Applications', text: 'Applications desktop et mobiles, y compris pour un usage interne à une équipe.', items: ['Desktop', 'Mobile', 'Applications métier'] },
          { icon: 'server', title: 'Backend', text: 'APIs, authentification et architecture serveur, conçues pour durer.', items: ['APIs REST', 'Authentification', 'Architecture serveur', 'Intégrations'] },
          { icon: 'database', title: 'Database', text: 'Conception de schémas et optimisation des accès aux données.', items: ['PostgreSQL', 'MySQL', 'SQLite', 'Conception de schémas', 'Optimisation'] },
        ],
      },
    ],
  },

  projects: {
    categories: [
      { id: 'web', label: 'Web' },
      { id: 'software', label: 'Software' },
      { id: 'fivem', label: 'FiveM' },
      { id: 'gaming', label: 'Gaming' },
      { id: 'discord', label: 'Discord' },
    ],
    items: [
      {
        id: 'ov-base-fivem', name: 'Ov Base — Serveur FiveM', categories: ['fivem', 'gaming'], featured: true,
        status: 'Base de développement', icon: 'car', tone: 'ember',
        summary: 'Base de serveur FiveM complète : multicharacter, inventaire, garage et fourrière, banque, commerces et carte d’identité.',
        presentation: 'Ov Base est une base de serveur FiveM créée pour comprendre et maîtriser les logiques du framework : synchronisation client/serveur, persistance en base de données et interfaces NUI. Elle regroupe la plupart des systèmes attendus sur un serveur roleplay, développés un par un plutôt que assemblés à partir de ressources existantes.',
        problem: 'Un serveur FiveM repose sur une multitude de systèmes qui doivent partager le même état : identité du joueur, argent, véhicules, inventaire. Assembler des ressources tierces mène vite à des conflits de données et à une base impossible à faire évoluer.',
        solution: 'Chaque système a été développé sur une base commune, avec une gestion centralisée du joueur et de la persistance. Deux menus administrateur ont volontairement été conservés, créés à un an d’intervalle, pour mesurer l’évolution de la structure du code.',
        features: ['Multicharacter développé sur mesure, en s’appuyant sur la logique de la ressource ESX', 'Deux menus administrateur créés à un an d’intervalle', 'Système de garage et de fourrière', 'Inventaire inspiré de la logique ox_inventory', 'Menu contextuel et menu F5 complet', 'Système bancaire complet', 'Boutique, Ammunation et LTD', 'Système de carte d’identité'],
        architecture: [
          { title: 'Client Lua + NUI', text: 'Interfaces en NUI (HTML/CSS/JS) pilotées par les scripts client, avec des échanges de messages typés.' },
          { title: 'Logique serveur', text: 'Les actions sensibles (argent, inventaire, véhicules) sont validées côté serveur, jamais côté client.' },
          { title: 'Persistance MySQL', text: 'Personnages, véhicules, inventaires et comptes bancaires stockés en base et rechargés à la connexion.' },
          { title: 'Découpage par ressource', text: 'Chaque système reste une ressource autonome pour pouvoir être activé, désactivé ou remplacé.' },
        ],
        tech: ['Lua', 'FiveM', 'ESX', 'NUI', 'MySQL'],
        result: 'Une base de travail réutilisable qui sert de socle et de référence technique pour les développements FiveM sur mesure.',
      },
      {
        id: 'vaultdesk', name: 'VaultDesk', categories: ['software'], featured: true,
        status: 'Projet personnel', icon: 'window', tone: 'ocean',
        summary: 'Logiciel desktop Electron regroupant administration, tickets, signalements, chat et recherche en base de données, derrière un login multi-profil.',
        presentation: 'VaultDesk est un logiciel de bureau développé pour apprendre et expérimenter Electron. Il rassemble dans une seule interface les outils habituellement éparpillés d’une équipe : administration des utilisateurs, tickets, signalements, messagerie interne et recherche en base de données.',
        problem: 'Gérer une communauté ou une petite structure oblige souvent à jongler entre plusieurs outils sans lien entre eux, avec autant de comptes et de niveaux d’accès à maintenir.',
        solution: 'Une application desktop unique, avec un login sécurisé multi-profil et un système de clés d’accès qui conditionne ce que chaque profil peut voir et faire.',
        features: ['Système complet d’administration', 'Gestion des tickets', 'Système de signalement', 'Chat intégré', 'Recherche en base de données', 'Login sécurisé multi-profil', 'Accès conditionné par clés'],
        architecture: [
          { title: 'Coque Electron', text: 'Processus principal pour les accès système, processus de rendu pour l’interface.' },
          { title: 'Interface en composants', text: 'Vues construites en JSX, chaque module (tickets, chat, recherche) restant indépendant.' },
          { title: 'Couche d’accès', text: 'Le profil et sa clé déterminent les modules chargés et les actions autorisées.' },
          { title: 'Base de données', text: 'Utilisateurs, tickets et signalements persistés et interrogés depuis le module de recherche.' },
        ],
        tech: ['Electron', 'JSX', 'Node.js', 'Database'],
        result: 'Un logiciel desktop complet qui a servi de terrain d’apprentissage sur Electron, la gestion de profils et la structuration d’une application multi-modules.',
      },
      {
        id: 'tor-project', name: 'Tor Project', categories: ['software'],
        status: 'Projet personnel', icon: 'network', tone: 'violet',
        summary: 'Outil en terminal orienté sécurité : informations machine, scan de ports évalué par niveau de risque et rotation d’adresse IP via le réseau Tor.',
        presentation: 'Tor Project est un outil en ligne de commande développé pour comprendre le fonctionnement du réseau Tor et des mécanismes de confidentialité réseau. Il centralise les informations de la machine, exécute des contrôles de sécurité et permet de faire tourner l’adresse IP publique via le réseau Tor.',
        problem: 'Les informations utiles à un diagnostic réseau et de sécurité sont dispersées entre plusieurs commandes système, et le fonctionnement réel du routage en oignon reste abstrait tant qu’on ne le manipule pas.',
        solution: 'Un terminal unique qui rassemble ces informations, exécute les scans et pilote la connexion au réseau Tor en s’appuyant sur le proxy Windows, avec une rotation automatique du nœud de sortie.',
        features: ['Centralisation des informations de la machine', 'Scan de sécurité complet du poste', 'Scan des ports ouverts avec évaluation du risque par code couleur', 'Changement d’adresse IPv4 publique en un clic', 'Connexion au réseau Tor via le proxy Windows', 'Rotation automatique d’IP toutes les 10 secondes'],
        architecture: [
          { title: 'Interface terminal', text: 'Une boucle de commandes unique, lisible, sans dépendance graphique.' },
          { title: 'Collecte système', text: 'Lecture des informations réseau et système du poste, agrégées dans une même vue.' },
          { title: 'Pilotage du proxy', text: 'Configuration du proxy Windows pour router le trafic à travers le réseau Tor.' },
          { title: 'Rotation programmée', text: 'Un minuteur déclenche le changement de circuit, donc de nœud de sortie et d’IP publique.' },
        ],
        tech: ['JavaScript', 'Node.js', 'Réseau Tor'],
        result: 'Une compréhension concrète du routage en oignon, de la configuration proxy et de la lecture d’une surface d’exposition réseau.',
        note: 'Outil personnel de diagnostic, développé et utilisé sur ma propre machine.',
      },
      {
        id: 'owo-search', name: 'OwO Search', categories: ['web'],
        status: 'Projet personnel', icon: 'search', tone: 'emerald',
        summary: 'Application web de recherche sur bases indexées automatiquement, avec authentification par clés d’accès et gestion complète des utilisateurs.',
        presentation: 'OwO Search est une application web construite autour d’un moteur de recherche interne : les bases de données sont indexées automatiquement, puis interrogées depuis une interface unique. L’accès est contrôlé par un système de clés, avec deux niveaux de compte.',
        problem: 'Consulter plusieurs jeux de données suppose de connaître leur structure et de les interroger un par un, ce qui rend l’outil inutilisable dès qu’il faut ouvrir l’accès à d’autres personnes.',
        solution: 'Une indexation automatique des sources et une interface de recherche unique, doublées d’un espace d’administration pour créer, modifier et supprimer les comptes et leurs clés.',
        features: ['Login administrateur et utilisateur', 'Accès conditionné par clés', 'Indexation automatique des bases de données', 'Recherche dans les données indexées', 'Création, modification et suppression des utilisateurs'],
        architecture: [
          { title: 'Interface web', text: 'Front en HTML, CSS et JavaScript, sans framework, pour rester léger.' },
          { title: 'Authentification par clés', text: 'La clé fournie détermine le rôle du compte et les écrans accessibles.' },
          { title: 'Indexation', text: 'Les sources sont parcourues et indexées automatiquement pour rendre la recherche rapide.' },
          { title: 'Administration', text: 'Un module CRUD gère le cycle de vie complet des utilisateurs.' },
        ],
        tech: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Database'],
        result: 'Une application web fonctionnelle couvrant l’ensemble du parcours : authentification, rôles, recherche et administration.',
      },
      {
        id: 'ov-secure', name: 'Ov Secure', categories: ['software'],
        status: 'Projet personnel', icon: 'lock', tone: 'gold',
        summary: 'Logiciel de chiffrement et déchiffrement de messages en AES-256-GCM avec dérivation de clé Argon2id et login protégé contre le bruteforce.',
        presentation: 'Ov Secure est un logiciel développé en Python pour chiffrer et déchiffrer des messages avec des primitives cryptographiques actuelles. La clé et le mot de passe de chiffrement sont choisis par l’utilisateur, et l’accès au logiciel est lui-même protégé.',
        problem: 'La qualité d’un chiffrement dépend autant des primitives choisies que de la façon dont la clé est dérivée et dont l’accès à l’outil est protégé — trois points faciles à rater.',
        solution: 'AES-256-GCM pour le chiffrement authentifié, Argon2id pour la dérivation de la clé à partir du mot de passe, et un module dédié qui bloque les tentatives de connexion répétées.',
        features: ['Chiffrement et déchiffrement de messages', 'Chiffrement authentifié AES-256-GCM', 'Dérivation de clé Argon2id', 'Clé et mot de passe choisis par l’utilisateur', 'Login protégé par un module anti-bruteforce'],
        architecture: [
          { title: 'Noyau cryptographique', text: 'AES-256-GCM : confidentialité et intégrité vérifiée au déchiffrement.' },
          { title: 'Dérivation de clé', text: 'Argon2id transforme le mot de passe en clé, avec un coût mémoire volontairement élevé.' },
          { title: 'Contrôle d’accès', text: 'Module anti-bruteforce dédié en amont de l’ouverture du logiciel.' },
        ],
        tech: ['Python', 'AES-256-GCM', 'Argon2id'],
        result: 'Un outil fonctionnel et une mise en pratique concrète du chiffrement authentifié et de la dérivation de clé moderne.',
      },
      {
        id: 'ov-bot', name: 'Ov Bot', categories: ['discord'],
        status: 'Projet personnel', icon: 'bot', tone: 'violet',
        summary: 'Bot Discord multi-serveurs avec hiérarchie de permissions : propriétaire, owner et whitelist.',
        presentation: 'Ov Bot est un bot Discord développé pour comprendre et expérimenter le fonctionnement de la plateforme. Il est conçu pour fonctionner simultanément sur plusieurs serveurs, chacun gardant sa propre configuration et ses propres droits.',
        problem: 'Un bot déployé sur plusieurs serveurs ne peut pas partager un seul niveau d’autorisation : chaque communauté a ses responsables, et une commande sensible ne doit jamais dépendre du serveur d’où elle est lancée.',
        solution: 'Une hiérarchie de permissions à trois niveaux — propriétaire, owner et whitelist — évaluée à chaque commande, avec une configuration propre à chaque serveur.',
        features: ['Fonctionnement multi-serveur', 'Niveau propriétaire', 'Niveau owner', 'Système de whitelist', 'Commandes conditionnées par le niveau d’accès'],
        architecture: [
          { title: 'Client Node.js', text: 'Connexion à l’API Discord et écoute des événements du gateway.' },
          { title: 'Routage des commandes', text: 'Chaque commande déclare le niveau de permission qu’elle exige.' },
          { title: 'Contrôle des droits', text: 'Le niveau de l’auteur est résolu avant exécution, jamais après.' },
          { title: 'Configuration par serveur', text: 'Chaque serveur conserve ses propres réglages et sa propre whitelist.' },
        ],
        tech: ['Node.js', 'JavaScript', 'API Discord'],
        result: 'Un bot stable en usage multi-serveur et une base réutilisable pour des bots Discord sur mesure.',
      },
      {
        id: 'ov7re-bot', name: 'Ov7rE Bot', categories: ['discord'],
        status: 'Projet personnel', icon: 'bot', tone: 'slate',
        summary: 'Bot Discord dédié à l’expérimentation et au développement de fonctionnalités automatisées.',
        presentation: 'Ov7rE Bot est un projet de bot conçu pour expérimenter et développer des fonctionnalités automatisées : il sert de terrain d’essai avant qu’une fonctionnalité soit intégrée à un projet plus large.',
        problem: 'Tester une nouvelle automatisation directement dans un bot utilisé au quotidien revient à faire porter le risque à la communauté qui s’en sert.',
        solution: 'Un bot séparé, dédié aux essais, où chaque automatisation peut être développée, cassée et reprise sans impact sur un serveur en service.',
        features: ['Fonctionnalités automatisées', 'Terrain d’essai isolé du reste des projets'],
        architecture: [
          { title: 'Client Node.js', text: 'Même socle technique que les autres bots, pour que le code testé soit directement réutilisable.' },
          { title: 'Modules d’automatisation', text: 'Chaque automatisation est isolée pour pouvoir être ajoutée ou retirée seule.' },
        ],
        tech: ['Node.js', 'JavaScript', 'API Discord'],
        result: 'Un environnement d’expérimentation qui accélère le développement des fonctionnalités destinées aux autres bots.',
      },
      {
        id: 'ov-sb', name: 'Ov SB', categories: ['discord'],
        status: 'Expérimentation technique', icon: 'terminal', tone: 'slate',
        summary: 'Expérimentation autour de l’automatisation d’un compte Discord : commandes exécutées sur un compte utilisateur plutôt que sur un bot.',
        presentation: 'Ov SB est une expérimentation technique autour de l’automatisation côté compte utilisateur : contrairement à un bot classique, l’outil se connecte avec un token utilisateur et répond à des commandes en n’interagissant que sur ce seul compte.',
        problem: 'Comprendre où s’arrête l’API bot de Discord et ce qui distingue réellement, techniquement, un client bot d’un client utilisateur.',
        solution: 'Un client léger qui écoute les commandes et exécute des actions d’usage quotidien, limité au périmètre d’un compte unique.',
        features: ['Connexion via token utilisateur', 'Réponse à des commandes', 'Actions limitées à un seul compte'],
        architecture: [
          { title: 'Client Node.js', text: 'Connexion et écoute des événements, sur le même socle que les autres projets Discord.' },
          { title: 'Interpréteur de commandes', text: 'Les commandes sont détectées puis exécutées dans le contexte du compte.' },
        ],
        tech: ['Node.js', 'JavaScript'],
        result: 'Une compréhension précise de la frontière entre client bot et client utilisateur sur Discord.',
        note: 'Projet d’apprentissage personnel, non distribué et non proposé en prestation : l’automatisation d’un compte utilisateur sort du cadre des conditions d’utilisation de Discord.',
      },
    ],
  },

  technologies: {
    groups: [
      { label: 'Frontend', items: [{ name: 'HTML', mark: 'HT' }, { name: 'CSS', mark: 'CS' }, { name: 'JavaScript', mark: 'JS' }, { name: 'TypeScript', mark: 'TS' }, { name: 'React', mark: 'RE' }] },
      { label: 'Backend', items: [{ name: 'Node.js', mark: 'ND' }, { name: 'Python', mark: 'PY' }, { name: 'API REST', mark: 'API' }] },
      { label: 'Database', items: [{ name: 'PostgreSQL', mark: 'PG' }, { name: 'MySQL', mark: 'MY' }, { name: 'SQLite', mark: 'SL' }] },
      { label: 'Gaming', items: [{ name: 'Lua', mark: 'LU' }, { name: 'FiveM', mark: 'FM' }, { name: 'Minecraft', mark: 'MC' }, { name: 'Roblox', mark: 'RB' }, { name: 'Discord', mark: 'DC' }] },
      { label: 'Desktop', items: [{ name: 'Electron', mark: 'EL' }] },
    ],
  },

  reviews: {
    items: [
      {
        name: 'Paul’',
        role: '',
        rating: 5,
        date: '',
        project: '',
        text: 'Super prestation réalisée très rapidement. Elle correspond parfaitement à ce que j’attendais, Ov7 a su être flexible quant à mes attentes et mon budget.\n\nJe ne peux que le recommander vivement !',
        hidden: false,
      },
    ],
  },

  pricing: {
    items: [
      { scope: 'FiveM', from: '50 €', detail: 'Fonctionnalité, script ou système complet' },
      { scope: 'Web', from: '150 €', detail: 'Landing page, site vitrine, dashboard, application' },
      { scope: 'Logiciel', from: '800 €', detail: 'Application desktop ou métier' },
    ],
    notice: 'Chaque projet étant unique, les tarifs affichés sont indicatifs. Demandez un devis personnalisé.',
  },

  contact: {
    intro: 'Décrivez votre projet en quelques lignes : je reviens vers vous avec une estimation.',
    projectTypes: ['FiveM', 'Minecraft', 'Roblox', 'Discord', 'Site web', 'Application', 'Logiciel', 'API', 'Autre'],
    budgets: ['< 100 €', '100 – 300 €', '300 – 750 €', '750 – 1 500 €', '1 500 € +', 'À définir'],
    deadlines: ['Dès que possible', 'Sous 1 mois', '1 à 3 mois', 'Plus de 3 mois', 'Pas de date fixée'],
    successMessage: 'Message bien reçu. Je reviens vers vous très vite.',
  },

  socials: {
    links: [{ label: 'GitHub', icon: 'github', href: 'https://github.com/ov7re' }],
  },

  os: {
    osName: 'OV7 OS',
    wallpaper: 'ember',
    accent: '#ff5a1f',
    theme: 'dark',
    boot: true,
    bootLines: [
      'Initialisation du noyau OV7',
      'Montage de /projets',
      'Chargement de la stack technique',
      'Connexion sécurisée à ov7.fr',
      'Session invitée prête',
    ],
    welcomeTitle: 'Bienvenue sur OV7 OS',
    welcomeText: 'Ce portfolio est un système d’exploitation. Ouvrez les applications, déplacez les fenêtres, essayez le terminal.',
    motd: 'OV7 OS — terminal invité.\nTapez « aide » pour la liste des commandes.',
    trash: true,
  },
};
