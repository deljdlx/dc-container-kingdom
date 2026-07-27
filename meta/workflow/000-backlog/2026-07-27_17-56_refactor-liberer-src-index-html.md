---
id: 2026-07-27_17-56
title: Libérer src/index.html pour accueillir une seconde application
type: refactor
group: git-kingdom
branch:
created: 2026-07-27 17:56
ready:
doing:
verify:
done:
---

## Objectif

Container Kingdom occupe la **racine** de `src/` : son `index.html` y est posé,
alors que son JS et son CSS vivent dans `src/container-kingdom/`. Cette asymétrie
passe inaperçue tant qu'il n'y a qu'une application ; elle bloque dès qu'il y en a
deux — `src/index.html` ne peut pas être à la fois le royaume Docker et la porte
d'entrée du projet.

Prérequis de `2026-07-27_17-55` (Git Kingdom), mais utile en soi : chaque
application doit posséder son dossier, et la racine servir de **seuil**.

## Spécifications

_Rempli en « specify »._

À arbitrer : la racine devient-elle un **lanceur** listant les royaumes (et la
démo, et le catalogue), ou une simple redirection ? Le lanceur a l'avantage de
donner enfin un point d'entrée au dépôt — aujourd'hui il faut connaître les URL
de `/engine/demo/` et `/engine/catalog/` pour les trouver.

Points de vigilance :

- `src/index.html` charge des chemins **relatifs** (`<script>`, `<link>`,
  polices) : les descendre d'un niveau les casse tous.
- `vite.config.js` déclare les pages dans `htmlEntries` (`main`, `engine/demo/`,
  `engine/catalog/`) et sert avec `root: 'src'`.
- Le déploiement sert `src/` directement (`compose.yaml` monte `./src` dans
  `/var/www/html`, et `nginx.conf` a un `index index.php index.html`) — déplacer
  l'entrée **change l'URL de production**.
- `mock/vite-docker-mock-plugin.js` intercepte `/api/docker/*` quel que soit le
  point d'entrée : sans impact, à confirmer.

## Contexte / liens

- `src/index.html`, `src/container-kingdom/`
- `vite.config.js` (`htmlEntries`, `root`)
- `compose.yaml`, `compose/nginx.conf` (ce qui est servi en prod)
- Chapeau : `2026-07-27_17-55`

## Definition of Done

- [ ] Container Kingdom possède son propre point d'entrée, hors racine.
- [ ] La racine sert de seuil (lanceur ou redirection — décision tracée).
- [ ] Aucun asset cassé : la page, la démo et le catalogue chargent tous, vérifié
      **au navigateur**.
- [ ] L'effet sur l'URL de production est **identifié et écrit** (elle change, ou
      elle est préservée, mais on sait laquelle).
- [ ] `npm run verify` vert ; `meta/documentation/` et les README à jour.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
