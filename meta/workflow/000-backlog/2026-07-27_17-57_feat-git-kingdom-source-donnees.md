---
id: 2026-07-27_17-57
title: Git Kingdom — source de données GitHub et mock de dev
type: feat
group: git-kingdom
branch:
created: 2026-07-27 17:57
ready:
doing:
verify:
done:
---

## Objectif

Donner à Git Kingdom l'équivalent de ce que `DockerApiClient` + le mock Vite sont
à Container Kingdom : un **client** vers l'API GitHub et un **mock** qui permet de
développer sans réseau ni jeton, comme `npm run dev` tourne aujourd'hui sans
daemon Docker.

C'est la brique qui conditionne tout le reste : sans données, pas de carte.

## Spécifications

_Rempli en « specify »._

### Contraintes qui structurent la solution

- **Quotas** : l'API GitHub plafonne à **60 requêtes/heure en anonyme**, 5 000
  authentifié. Le socket Docker était local et illimité ; ici le **cache et la
  parcimonie sont une contrainte de départ**, pas une optimisation.
- **Un jeton ne peut pas vivre dans le front** : le dépôt est public, et une page
  statique ne garde pas de secret. Soit on reste en anonyme (et on cadre le
  besoin en dessous de 60 req/h), soit il faut un intermédiaire — décision de
  *specify*, avec un œil sur `2026-07-27_17-28` (sécurité) : ne pas rouvrir un
  proxy sans authentification.
- **Fraîcheur** : un dépôt bouge à l'échelle de l'heure ou du jour, pas des 5
  secondes de la boucle Docker. La cadence de rafraîchissement n'a pas à être la
  même.

### À faire

- Client isolé (le pendant de `DockerApiClient`), sans DOM, testable.
- Mock servi en dev, sur le modèle de `mock/vite-docker-mock-plugin.js` — à
  **juxtaposer ou généraliser** : le plugin actuel est câblé en dur dans
  `vite.config.js` et n'intercepte que `/api/docker/*`.
- Fixtures réalistes, avec la même vigilance que
  `2026-07-27_11-20` : dépôt **public**, donc rien d'identifiant qui ne soit déjà
  public — ici c'est plus simple, les dépôts visés le sont par définition.

## Contexte / liens

- Modèles à suivre : `src/container-kingdom/js/DockerApiClient.js`,
  `mock/docker-mock.js`, `mock/vite-docker-mock-plugin.js`, `mock/README.md`
- `vite.config.js` (branchement du plugin de mock)
- Chapeau : `2026-07-27_17-55` · Sécurité : `2026-07-27_17-28`

## Definition of Done

- [ ] `npm run dev` affiche des données **sans réseau ni jeton** (mock), comme
      aujourd'hui sans daemon Docker.
- [ ] Le client est couvert par des tests, y compris ses **échecs** — une panne
      ou un quota dépassé ne doit pas être confondu avec « aucun dépôt » (leçon
      de `2026-07-27_16-05`).
- [ ] Le comportement face au **quota atteint** est défini et testé.
- [ ] La décision jeton / anonyme / intermédiaire est **écrite**, avec son
      implication de sécurité.
- [ ] `mock/README.md` couvre la nouvelle source.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
