# OV7 OS — portfolio d'OV7 Development

Le portfolio **[ov7.fr](https://ov7.fr)** est un faux système d'exploitation :
bureau, fenêtres déplaçables, barre des tâches, menu démarrer, terminal.
Il est piloté par **OV7 Studio**, le logiciel d'administration
(**admin.ov7.fr**), relié au site par une API. Le tout tourne sur un NAS,
exposé par un tunnel Cloudflare.

```
                     Cloudflare (HTTPS, tunnel, Access)
                     │                         │
              ov7.fr │                         │ admin.ov7.fr
                     ▼                         ▼
   ┌──────────────── NAS · Docker ─────────────────────────────┐
   │  cloudflared ──► ov7 (Node.js, port 8080)                  │
   │                   ├─ site/      OV7 OS (public)            │
   │                   ├─ admin/     OV7 Studio (logiciel)      │
   │                   ├─ /api/public/*   contenu, contact      │
   │                   ├─ /api/admin/*    tout le reste         │
   │                   └─ data/      contenu, versions, images  │
   └────────────────────────────────────────────────────────────┘
```

Aucune dépendance npm : Node.js seul, du HTML, du CSS et du JavaScript natifs.

---

## Ce que permet le logiciel

| Fonction | Où |
| --- | --- |
| Ajouter, modifier, masquer, réordonner les **avis clients** | Avis clients |
| Modifier **toutes les parties du site** : identité, à propos, méthode, services, projets, stack, tarifs, contact, réseaux, apparence d'OV7 OS | Menu « Sections du site » |
| **Prévisualiser** le brouillon sur le vrai site avant publication | bouton Prévisualiser |
| **Déployer** le brouillon en production, garder l'historique, **restaurer** une ancienne version | Déploiement |
| Activer le **mode maintenance** (effet immédiat, message personnalisable) | Maintenance, ou interrupteur du tableau de bord |
| **Installer les mises à jour du code** depuis GitHub, avec maintenance automatique pendant l'installation | Mises à jour |
| Lire les **messages** du formulaire de contact | Messages |
| Envoyer des **images** (couvertures, captures) | Médias |
| Suivre la fréquentation (sans cookie), le journal d'activité, changer le mot de passe | Tableau de bord, Journal, Compte |

OV7 Studio s'installe comme une application (Chrome / Edge : icône
« Installer » dans la barre d'adresse) : il s'ouvre alors dans sa propre fenêtre.

### Brouillon, déploiement, versions

Toute modification enregistrée va dans un **brouillon** : le site public ne
change pas. Le bouton **Déployer** publie le brouillon d'un coup et crée une
version (v1, v2, v3…). Les 50 dernières versions sont conservées ; chacune peut
être **remise en ligne** ou **rechargée dans le brouillon**.

La maintenance et les messages, eux, ne passent pas par le brouillon : ils
prennent effet immédiatement.

---

## Arborescence

```
.
├── server/                 API et serveur HTTP (Node.js, aucune dépendance)
│   ├── index.js            point d'entrée : routage par domaine, sécurité, pages
│   ├── config.js           variables d'environnement
│   ├── routes/             public.js (site) · admin.js (logiciel)
│   ├── lib/                auth, contenu & versions, maintenance, messages,
│   │                       statistiques, mises à jour git, rendu SEO, fichiers
│   ├── seed/content.js     contenu initial (repris de l'ancien site)
│   └── scripts/            set-password.js
├── shared/                 code commun au site, au logiciel et au serveur
│   ├── schema.js           ← schéma du contenu : formulaires ET validation
│   ├── icons.js            jeu d'icônes
│   └── util.js
├── site/                   OV7 OS
│   ├── index.html          gabarit (balises SEO injectées par le serveur)
│   ├── maintenance.html    écran de maintenance
│   ├── css/  js/           shell.js (bureau), wm.js (fenêtres), apps/ (une app par fichier)
├── admin/                  OV7 Studio (logiciel)
│   ├── js/form.js          moteur de formulaires généré depuis le schéma
│   └── js/views/           un écran par fichier
├── data/                   ⚠ données d'exécution (non versionnées) — à sauvegarder
├── Dockerfile · docker-compose.yml · .env.example
```

**Ajouter un champ au site** : le déclarer dans `shared/schema.js`, puis
l'afficher dans l'application concernée (`site/js/apps/…`). Le formulaire du
logiciel et la validation côté serveur suivent automatiquement ; au démarrage,
le contenu existant reçoit la valeur par défaut du nouveau champ.

---

## Développement en local

Node.js 22 ou plus récent.

```bash
cp .env.example .env      # puis renseigner ADMIN_PASSWORD, SITE_URL=http://localhost:8080, ADMIN_HOSTS=admin.localhost
npm run dev
```

- Site : <http://localhost:8080>
- Logiciel : <http://admin.localhost:8080> (Chrome, Edge et Firefox résolvent
  `*.localhost` sans configuration)

Les données sont créées dans `data/` au premier démarrage, à partir de
`server/seed/content.js`. Pour repartir de zéro : arrêter le serveur et
supprimer `data/`.

---

## Installation sur le NAS

Prérequis : Docker et Docker Compose (Synology Container Manager, QNAP
Container Station, Unraid, TrueNAS…), un accès SSH, le domaine `ov7.fr` géré
par Cloudflare.

### 1. Récupérer le projet

```bash
git clone https://github.com/ov7re/portfolio.git ov7
cd ov7
cp .env.example .env
```

Compléter `.env` : `ADMIN_PASSWORD` (long et unique), `CLOUDFLARE_TUNNEL_TOKEN`
(étape 2). Si le dépôt est privé, le cloner avec un jeton d'accès en lecture
pour que les mises à jour puissent le récupérer.

### 2. Créer le tunnel Cloudflare

Dans le tableau de bord Cloudflare : **Zero Trust → Réseaux → Tunnels →
Créer un tunnel** (type *Cloudflared*), choisir l'environnement **Docker** et
copier le jeton dans `CLOUDFLARE_TUNNEL_TOKEN`.

Ajouter ensuite trois **noms d'hôte publics**, tous vers le même service :

| Nom d'hôte | Service |
| --- | --- |
| `ov7.fr` | `http://ov7:8080` |
| `www.ov7.fr` | `http://ov7:8080` (redirigé vers ov7.fr par le serveur) |
| `admin.ov7.fr` | `http://ov7:8080` |

`ov7` est le nom du conteneur : les deux conteneurs partagent le même réseau Docker.

### 3. Protéger le logiciel avec Cloudflare Access (recommandé)

**Zero Trust → Accès → Applications → Ajouter → Auto-hébergée**, domaine
`admin.ov7.fr`, règle « Autoriser » limitée à votre adresse e-mail. Cloudflare
demande alors un code envoyé par e-mail **avant même** d'afficher la page de
connexion du logiciel : deux verrous au lieu d'un.

L'API d'administration n'existe que sur `admin.ov7.fr` : elle répond 404 sur
`ov7.fr`, ce qui empêche de contourner cette protection.

### 4. Démarrer

```bash
docker compose up -d --build
docker compose logs -f ov7
```

Le site est en ligne sur <https://ov7.fr>, le logiciel sur <https://admin.ov7.fr>.

### 5. Ancien hébergement GitHub Pages

Une fois le tunnel en place, supprimer dans Cloudflare les enregistrements DNS
qui pointaient vers GitHub Pages (le tunnel crée les siens), puis désactiver
Pages dans les réglages du dépôt GitHub.

---

## Déployer une nouvelle version du code

1. Développer sur votre machine, puis `git push` sur la branche `main`.
2. Dans le logiciel : **Mises à jour → Rechercher**, vérifier la liste des
   changements, **Installer la mise à jour**.

Le serveur fait un `git pull` (avance rapide uniquement : jamais d'écrasement
silencieux). Si seuls le site ou le logiciel ont changé, c'est immédiat. Si le
code du serveur a changé, le processus redémarre tout seul (Docker le relance)
et le logiciel se reconnecte. Avec l'option cochée, le site passe en
maintenance pendant l'installation puis revient automatiquement.

Sans passer par le logiciel : `git pull && docker compose restart ov7`.
Après une modification du `Dockerfile` : `docker compose up -d --build`.

---

## Sauvegarde

Tout ce qui ne vient pas de git est dans **`data/`** : contenu, versions,
messages, images, compte, statistiques. Une tâche de sauvegarde du NAS (Hyper
Backup, snapshot…) sur ce dossier suffit.

Mot de passe oublié :

```bash
docker compose exec ov7 npm run set-password
```

---

## Sécurité

- Mot de passe haché (scrypt), sessions opaques en cookie `HttpOnly`,
  `Secure`, `SameSite=Strict`, 6 tentatives de connexion par 15 min et par IP.
- Protection CSRF : en-tête obligatoire sur toute écriture de l'API admin.
- En-têtes stricts (CSP sans script en ligne, `X-Frame-Options`, HSTS…).
- Contenu nettoyé côté serveur selon le schéma, puis échappé à l'affichage.
- Formulaire de contact : validation serveur, champ piège anti-robot,
  3 messages par 10 min et par IP.
- Images : PNG, JPEG, WebP, GIF uniquement, format vérifié sur le contenu du
  fichier (pas d'SVG, qui peut contenir du script).
- Fréquentation sans cookie ni stockage d'adresse IP.
