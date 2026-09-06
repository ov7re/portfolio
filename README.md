# OV7 Development — Portfolio

Site vitrine d'OV7 Development, en ligne sur **[ov7.fr](https://ov7.fr)**.

HTML, CSS et JavaScript natifs, sans build : GitHub Pages sert les fichiers de
la racine tels quels, un `git push` suffit à mettre le site en ligne.

Deux librairies seulement, chargées depuis un CDN et **toutes deux optionnelles** :
**GSAP + ScrollTrigger** pour le motion design, **Three.js** pour la scène 3D.
Si l'une ou l'autre est bloquée, le site reste complet et lisible.

---

## Structure

```
.
├── index.html              page d'accueil (texte statique = français de référence)
├── projet.html             page projet, alimentée par ?id=<identifiant>
├── 404.html                page d'erreur GitHub Pages
├── robots.txt / sitemap.xml / CNAME
│
├── assets/                 favicon et image Open Graph
│
├── styles/
│   ├── base.css            variables, reset, typographie, utilitaires
│   ├── components.css      boutons, cartes, formulaire, filtres
│   ├── sections.css        sections de l'accueil + responsive
│   ├── project.css         page projet
│   └── motion.css          scène 3D, voiles, états de départ des animations
│
├── scripts/
│   ├── data/               ← tout le contenu modifiable est ici
│   │   ├── site.js         identité, contacts, liens, config du formulaire
│   │   ├── projects.js     les projets
│   │   ├── services.js     les deux pôles et leurs prestations
│   │   ├── technologies.js la stack
│   │   ├── content.js      méthode, avantages, à propos, avis, tarifs
│   │   └── form.js         options du formulaire de devis
│   ├── components/         un fichier par section, chacun ne fait qu'afficher
│   ├── lib/
│   │   ├── dom.js          utilitaires DOM, échappement, typographie française
│   │   ├── icons.js        jeu d'icônes SVG inline
│   │   ├── cover.js        illustrations de projet générées en SVG
│   │   ├── theme.js        thème clair / sombre
│   │   ├── reveal.js       apparitions — voie de secours sans GSAP
│   │   ├── motion.js       couche de motion design (GSAP + ScrollTrigger)
│   │   ├── scene3d.js      scène 3D persistante (Three.js)
│   │   └── shapes.js       les formes prises par le nuage de points
│   ├── i18n/               internationalisation (français aujourd'hui)
│   └── pages/              points d'entrée : home.js et project.js
│
└── tools/
    └── build-sitemap.mjs   régénère sitemap.xml
```

Principe : **les composants n'inventent aucun contenu**, ils lisent `scripts/data/`.
Pour changer le site, on modifie une donnée, pas un composant.

---

## Modifier le contenu

### Ajouter un projet

1. Copier un bloc dans `scripts/data/projects.js` et compléter les champs
   (l'en-tête du fichier les décrit un par un).
2. Choisir un `motif` parmi ceux listés dans `scripts/lib/cover.js`
   (`desktop`, `terminal`, `network`, `search`, `lock`, `bot`, `vehicle`) :
   l'illustration est générée automatiquement, aucune image à produire.
3. Régénérer le sitemap :

```bash
node tools/build-sitemap.mjs
```

Le projet apparaît aussitôt dans la grille, dans les filtres (dont les compteurs
se recalculent seuls) et sur sa propre page `projet.html?id=<identifiant>`.

### Règles de contenu

- Ne présenter que des projets réels, avec leur **état réel** (`status`).
- `links` et `screenshots` restent vides tant que le lien ou la capture n'existe
  pas : les blocs correspondants disparaissent d'eux-mêmes.
- Les avis (`content.js`) sont réels uniquement. Liste vide = section masquée.
- Les statistiques sont **calculées** à partir des données, jamais saisies.

---

## Mouvement et 3D

### La scène 3D

Un nuage de ~7 000 points (2 600 sur mobile) occupe un canvas fixe derrière
toute la page. Il ne disparaît jamais : il **change de forme à chaque section**,
ce qui donne au site un fil visuel continu.

L'enchaînement est décrit dans `scripts/lib/shapes.js` :

| Section        | Forme                                   |
| -------------- | --------------------------------------- |
| Accueil        | le « 7 » de la marque, en volume        |
| Services       | deux amas — les deux pôles d'activité   |
| Méthode        | une double hélice qui avance            |
| Projets        | une trame régulière — l'architecture    |
| Technologies   | une constellation sphérique             |
| À propos       | un champ d'ondes au repos               |
| Contact        | retour au « 7 »                         |

Pour changer une forme, écrire un générateur qui renvoie un `Float32Array` de
`count * 3` coordonnées et l'ajouter à `shapeSequence`. La section qui la
déclenche est désignée par son attribut `data-shape` dans le HTML.

Réglages utiles dans `scripts/lib/scene3d.js` : `DESKTOP_POINTS`,
`MOBILE_POINTS`, `MORPH_DURATION`, et les uniformes `uSize` (taille des points
en pixels) et `uOpacity`. La densité du voile de lisibilité se règle avec
`.scene-scrim { opacity }` dans `motion.css`.

### Le motion design

Personnalité de mouvement **Premium**, définie en tête de `scripts/lib/motion.js` :

- durées : 0,18 s (retour immédiat) · 0,45 s (standard) · 0,9 s (révélation) ;
- easing : `power2.out` en entrée, `power2.in` en sortie ;
- amplitude faible, aucun rebond ;
- trois couches toujours présentes : élément principal, détail secondaire,
  fond vivant (la scène 3D).

Le balisage se fait par attributs, jamais par classe d'animation :

| Attribut            | Effet                                                |
| ------------------- | ---------------------------------------------------- |
| `data-anim="fade"`  | translation courte + opacité                          |
| `data-anim="card"`  | cascade de cartes (lot de 6, 50 ms d'écart)           |
| `data-anim="mask"`  | le texte monte derrière un masque (titres)            |
| `data-magnetic`     | bouton légèrement magnétique (souris uniquement)      |
| `data-tilt`         | carte inclinée au survol                              |
| `data-parallax`     | élément de fond plus lent que le contenu              |
| `data-shape`        | forme 3D déclenchée par la section                    |

### Règle de sécurité

Un élément n'est masqué **que tant qu'un mécanisme actif s'engage à le révéler** :

- `html.motion` — GSAP anime. La classe est posée avant le premier rendu, puis
  retirée automatiquement après 4 s si la couche mouvement n'a pas confirmé son
  démarrage (`data-motion="ready"`).
- `html.reveal-js` — voie de secours, posée par `observeReveals()` lui-même.

Sans JavaScript, avec un CDN bloqué ou un module en échec, aucune des deux
classes n'est présente : **rien n'est caché**. Ce comportement est vérifiable en
remplaçant l'URL de GSAP par une adresse injoignable dans `index.html`.

`prefers-reduced-motion` désactive toute la couche : pas de pin, pas de
transformation progressive, pas de voile.

---

## Formulaire de devis

Aujourd'hui : validation côté client puis repli e-mail (`mailto`) pré-rempli.

Pour brancher une API plus tard, renseigner l'URL dans `formConfig.endpoint`
(`scripts/data/site.js`). Le formulaire enverra alors un `POST` JSON :

```
Frontend  →  Backend / API  →  Email · Discord · CRM
```

**Ne jamais mettre ici une URL de webhook Discord ni une clé d'API** : tous ces
fichiers sont publics. Le secret, la protection anti-spam et l'envoi réel
appartiennent au backend. Un piège à robots (champ caché) est déjà en place
côté client, mais il ne remplace pas une vérification serveur.

---

## Thème et langues

- **Thème** : sombre par défaut, bascule claire mémorisée dans le navigateur.
  La scène 3D suit (mélange normal et couleurs plus denses en clair).
- **Langues** : le français est la langue de référence et vit dans le HTML.
  Pour ajouter l'anglais, suivre le mode d'emploi en tête de
  `scripts/i18n/index.js` — aucun composant n'est à modifier.

---

## Développement local

Les modules ES imposent un vrai serveur HTTP (l'ouverture directe du fichier
`index.html` ne fonctionne pas) :

```bash
npx http-server -p 4173 -c-1
```

Puis ouvrir <http://localhost:4173>.

---

## Vérifications avant mise en ligne

- Aucun défilement horizontal de 375 px à 1920 px.
- Le formulaire refuse les champs vides, un e-mail invalide, une description
  trop courte et l'absence de type de projet.
- `projet.html?id=inconnu` affiche une page « projet introuvable » propre.
- GSAP injoignable : la page reste entièrement lisible.
- Le sitemap est à jour après tout ajout ou retrait de projet.
