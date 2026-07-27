---
id: 2026-07-26_14-32
title: Alléger le polling des stats Docker (double fetch, size=true, N+1)
type: refactor
branch: copilot/perf-polling-stats-docker
created: 2026-07-26 14:32
ready: 2026-07-27 17:40
doing: 2026-07-27 17:40
verify: 2026-07-27 17:42
done:
---

## Objectif

Toutes les 5 secondes, la boucle de l'app effectue, pour N conteneurs :

1. `GET /containers/json?all=true` (via `loadContainers`) ;
2. `GET /containers/json?all=true&**size=true**` (via `getAllContainersStats`, qui
   **re-liste** les conteneurs alors que le repository vient de le faire) ;
3. `GET /containers/{id}/stats?stream=false` × N.

Soit **N + 2** requêtes par tick, dont une liste redondante. Le `size=true` est le
point le plus coûteux : sur un daemon réel, il force le calcul de la taille des
couches de **tous** les conteneurs — c'est l'appel Docker lent par excellence — et
la donnée n'est **pas utilisée** (seules les stats CPU/mémoire le sont).

## Spécifications

### Fonctionnel

- Les stats CPU / mémoire restent à jour avec la même fraîcheur perçue.
- Le comportement dégradé reste inchangé : un conteneur dont les stats échouent est
  simplement ignoré (déjà le cas).

### Technique

- `getAllContainersStats()` doit **recevoir** la liste d'ids plutôt que refaire un
  `GET /containers/json` : le repository connaît déjà ses conteneurs. Cela retire
  au passage `size=true`.
- Ne demander les stats que des conteneurs **en cours d'exécution** (un conteneur
  `exited` n'a pas de stats utiles).
- Vérifier le calcul CPU : il a besoin de deux échantillons consécutifs
  (`previousStats`), donc l'intervalle de polling influe sur la valeur — documenter
  ce couplage.
- Envisager (en *specify*) une limite de concurrence sur le fan-out des stats :
  `Promise.all` sur 50 conteneurs, c'est 50 requêtes simultanées au daemon.
- Le mock (`mock/docker-mock.js`) doit rester cohérent avec les routes réellement
  appelées.

## Contexte / liens

- `src/container-kingdom/js/DockerApiClient.js` (`getAllContainersStats`,
  `loadContainerStats`)
- `src/container-kingdom/js/ContainerRepository.js` (`loadContainersStats`)
- `src/container-kingdom/js/ContainerKingdom.js` (`loop`, `LOOP_INTERVAL_MS`)
- `mock/docker-mock.js`, `mock/README.md`, `test/DockerApiClient.test.js`
- Docs : `meta/documentation/container-kingdom.md`

## Definition of Done

- [ ] Plus de second `GET /containers/json`, plus de `size=true`.
- [ ] Stats demandées uniquement pour les conteneurs en exécution.
- [ ] Tests mis à jour / ajoutés sur `DockerApiClient` et le repository (nombre et
      nature des appels).
- [ ] Mock aligné, doc du cycle de rafraîchissement à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 17:41] refactor `DockerApiClient.getAllContainersStats()` : l'API reçoit désormais une liste d'IDs (plus de relist `/containers/json`, plus de `size=true`) et applique une concurrence bornée (`STATS_CONCURRENCY_LIMIT=8`) sur le fan-out des `/stats`.
- [2026-07-27 17:41] `ContainerRepository.loadContainersStats()` calcule les IDs `running` uniquement et les passe au client ; comportement d'échec inchangé (stats en erreur ignorées au niveau conteneur, boucle globale robuste).
- [2026-07-27 17:41] tests et docs mis à jour : assertions sur l'absence de requête redondante, sur le filtrage running, et documentation du couplage CPU à l'intervalle de polling.

### Vérification

- [2026-07-27 17:42] tests ciblés `DockerApiClient.test.js` + `ContainerRepository.test.js` verts : couverture du nouvel appel `getAllContainersStats(ids)`, assertion d'absence de `/containers/json` et `size=true` pendant l'agrégation, et vérification du filtrage `running` côté repository.
- [2026-07-27 17:42] `npm run verify` vert (lint + build + 39 fichiers / 274 tests). DoD atteinte : plus de second listing Docker, plus de `size=true`, mock/tests/doc alignés.

### Validation

-
