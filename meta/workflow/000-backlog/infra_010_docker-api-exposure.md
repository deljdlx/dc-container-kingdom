---
id: 2026-07-27_17-28
title: Sécurité — l'API Docker est lisible par n'importe qui, et les logs s'exécutent
type: fix
branch:
created: 2026-07-27 17:28
ready:
doing:
verify:
done:
---

## Objectif

Le déploiement publie l'application sur Internet et proxifie l'API Docker
**sans aucune authentification**. Deux conséquences, l'une d'exposition, l'autre
d'exécution — et elles se combinent.

Relevé du 2026-07-27, sur les fichiers du dépôt (pas une intuition) :

### 1. L'API Docker est lisible publiquement, sans authentification

- `compose.yaml` publie le service via Traefik sur `Host("${DOMAIN}")`,
  entrypoint `websecure` + TLS — donc **exposé sur Internet**.
- `compose/nginx.conf` proxifie `location /api/docker/` vers
  `http://docker-api:2375/` **sans auth, sans filtrage de route**.
- Le socket-proxy est ouvert au-delà de son défaut : `CONTAINERS: 1` et
  `SYSTEM: 1` (les deux valent `0` dans l'image).

Conséquence : `https://<domaine>/api/docker/containers/json?all=true` répond à
**qui le demande**. Et `/containers/{id}/json` expose `Config.Env` — c'est-à-dire
les **variables d'environnement de tous les conteneurs de l'hôte** : mots de
passe de bases, jetons d'API, secrets applicatifs.

### 2. Les logs d'un conteneur s'exécutent dans le navigateur

`LogEntry.getElement()` assigne les lignes de log **brutes** à `innerHTML`
(trois fois : lignes 93, 99, 111). La source est `/containers/{id}/logs`, donc
**tout ce qu'un conteneur écrit sur stdout**. Un conteneur — y compris une image
tirée d'un registre public — qui journalise
`<img src=x onerror="...">` obtient l'exécution de script dans le dashboard.

Même vecteur, moins direct, pour les **noms** et **labels** : `ContainersListEntry`
(l. 19 et 23), `ContainersList` (l. 25, nom du projet compose), `ContainerView`
(l. 37) passent tous par `innerHTML`.

### Pourquoi les deux ensemble sont pires que séparément

Le XSS s'exécute sur une page qui a un accès **non authentifié** à l'API Docker,
et `nginx.conf` ajoute `Access-Control-Allow-Origin *` sur `/api/docker/` : le
script injecté lit l'API et exfiltre — les secrets du point 1 sortent par le
trou du point 2. Le CORS `*` permet en prime à **n'importe quel site tiers**
visité par n'importe qui d'interroger l'API, sans même passer par le dashboard.

### Ce qui, en revanche, est déjà tenu

À vérifier sur l'instance, mais sur pièces : le socket-proxy laisse à `0` les
variables `POST`, `ALLOW_START`, `ALLOW_STOP`, `ALLOW_RESTARTS` (défauts de
l'image, non surchargés par `compose.yaml`), et `EXEC`, `BUILD`, `NETWORKS` sont
explicitement à `0`. Les boutons **Start** et **Destroy** de l'UI sont donc
vraisemblablement **refusés par le proxy** — l'exposition est en **lecture**, pas
en prise de contrôle. C'est ce qui distingue une fuite grave d'une compromission
de l'hôte, et c'est le premier point à confirmer.

## Spécifications

### Découpé en deux : la convention de nommage l'a rendu visible

Le ticket annonçait qu'il était volontairement gros. En le spécifiant, le
découpage saute aux yeux : **il couvre deux projets**. L'exposition et le CORS
vivent dans `compose.yaml` / `compose/nginx.conf` — donc `infra`. Le rendu de
données non fiables vit dans `src/container-kingdom/js/` — donc
`container-kingdom`. Un ticket qui ne sait pas quel préfixe porter est un ticket
qui en cache deux.

- **Ce ticket garde** l'exposition et le CORS.
- **Le rendu part** dans `2026-07-29_08-26` (`container-kingdom_020_untrusted-data-rendering`),
  qui peut avancer **sans décision d'infrastructure** — c'est ce qui justifie le
  découpage plutôt qu'un simple dosage.

Les deux restent liés : c'est leur **combinaison** qui transforme une fuite en
exfiltration. Corriger le rendu seul laisse l'API lisible ; corriger l'exposition
seule laisse une page qui exécute ce que les conteneurs journalisent.

### ⚠️ Ce qui reste ici demande une décision qui n'appartient pas à l'agent

« Faut-il que ce dashboard soit joignable depuis Internet ? » n'est pas une
question technique : elle engage l'accès quotidien du propriétaire à son propre
outil. Les pistes, de la plus radicale à la plus coûteuse :

- ne plus publier via Traefik — accès LAN ou VPN uniquement ;
- authentification basique au niveau du proxy ;
- middleware Traefik d'authentification ;
- filtrage des routes autorisées dans nginx (limite la casse sans fermer l'accès).

Le CORS, lui, ne demande aucun arbitrage : `Access-Control-Allow-Origin *` sur une
API de contrôle Docker n'a pas de justification connue. À vérifier qu'il ne sert
à rien, puis à retirer.

**Ce ticket ne doit pas démarrer sans cette réponse** — appliquer une des quatre
pistes au jugé, c'est décider à la place du propriétaire quel accès il perd.

## Contexte / liens

- `compose.yaml` (publication Traefik, variables du socket-proxy)
- `compose/nginx.conf` (proxy `/api/docker/`, CORS)
- `src/container-kingdom/js/LogEntry.js` (l. 93, 99, 111),
  `ContainersListEntry.js`, `ContainersList.js`, `ContainerView.js`
- `src/container-kingdom/js/DockerApiClient.js` (routes appelées)
- `.env.sample` : `LOCAL_IP=127.0.0.1` par défaut — mais `compose.yaml` publie
  `${LOCAL_IP}:2375:2375` et porte déjà un
  `# TODO : Change this to a more secure setup`, avec un `- "2375:2375"` (toutes
  interfaces) commenté juste au-dessus.

## Definition of Done

- [ ] **Confirmé sur l'instance** : ce que l'API répond réellement à un appel
      anonyme depuis Internet (lecture ? écriture ?), preuve à l'appui.
- [ ] Plus aucun accès anonyme en lecture à l'API Docker depuis Internet.
- [ ] Le CORS `*` est retiré ou justifié par écrit.
- [ ] La décision sur l'exposition (publique / LAN / authentifiée) est **prise par
      le propriétaire** et tracée dans le ticket, pas seulement appliquée.
- [ ] Le rendu est traité par `2026-07-29_08-26` — les deux doivent être clos pour
      que la chaîne fuite → exfiltration soit rompue.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
