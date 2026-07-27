---
id: 2026-07-27_18-53
title: Topologie des routes — la chaîne suit l'ordre de l'API, pas la carte
type: refactor
branch: copilot/road-topology-strategy
created: 2026-07-27 18:53
ready: 2026-07-27 20:01
doing: 2026-07-27 20:01
verify:
verify: 2026-07-27 20:08
done: 2026-07-27 20:11
---

## Objectif

La superposition des routes est corrigée (`2026-07-27_17-37`), mais la **moitié
que ce ticket avait explicitement écartée** reste entière : chaque réseau est
tracé comme une **chaîne** `[0]→[1]→[2]→…`, chaque saut en **L** (horizontal puis
vertical), et l'ordre est celui de `Object.values(this.containers)` — c'est-à-dire
celui de l'API Docker. Rien de spatial.

Une chaîne qui traverse la carte dans un ordre arbitraire **repasse sur ses
propres segments** et fait de longs détours. Mesuré sur les fixtures : le réseau
`web` compte **32 conteneurs**, soit **31 sauts en L** à travers toute la carte.

Constat de clôture de `17-37` : la déduplication a supprimé les doublons, mais
les routes restent peu lisibles sur les grands réseaux, avec des détours qui
occupent beaucoup d'espace pour rien.

## Spécifications

_Rempli en « specify »._

C'est un **choix de conception**, pas une correction : tronc commun, étoile
autour d'un nœud central, arbre couvrant minimal sur les distances de la grille…
Chaque option change la lecture de la carte, pas seulement son encombrement.

### Décision de topologie

- La topologie retenue est un **arbre couvrant minimal** calculé sur les
  coordonnées déterministes de `ContainerPlacement`, avec distance de Manhattan
  et tie-breakers lexicographiques pour rester stable.
- L'ordre de l'API Docker n'intervient plus ni dans le choix des arêtes ni dans
  l'ordre d'affichage des réseaux partagés.
- On écarte la chaîne API-order, parce qu'elle fait des détours arbitraires, et
  l'étoile centrale, parce qu'elle crée un goulot visuel unique sur les grands
  réseaux.

Points de vigilance :

- Le placement des maisons est **déterministe** (`ContainerPlacement`) : la
  topologie peut s'appuyer sur les coordonnées réelles plutôt que sur l'ordre
  d'arrivée.
- Ne pas défaire la déduplication acquise en `17-37`, ni le filtre par réseau qui
  en dépend (une route porte tous les réseaux qui l'empruntent).
- Le rendu doit rester **stable** entre deux rafraîchissements : une topologie
  qui change de forme à chaque tick serait pire que des détours.

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdomRenderer.js` (`drawNetworks`,
  `drawHorizontalRoads`, `drawVerticalRoads`)
- `src/container-kingdom/js/ContainerRepository.js` (`_rebuildNetworks`, l'ordre)
- `src/container-kingdom/js/ContainerPlacement.js` (coordonnées déterministes)
- Ticket d'origine : `2026-07-27_17-37` (superposition — la moitié déjà traitée)

## Definition of Done

- [ ] La topologie retenue est **écrite et justifiée**, avec ce qu'elle écarte.
- [ ] Le tracé ne dépend plus de l'ordre de l'API Docker — même ensemble de
      conteneurs, même carte, quel que soit l'ordre de la réponse.
- [ ] Aucune régression sur la déduplication ni sur le filtre par réseau.
- [ ] Le tracé est stable entre deux rafraîchissements.
- [ ] Vérifié **au navigateur** : c'est un critère visuel, les tests ne concluent
      pas seuls.
- [ ] `npm run verify` vert.

## Suite

aucune

## Journal

### Travail

- [2026-07-27 20:04] Choix arrêté: arbre couvrant minimal sur les coordonnées de placement, avec tri déterministe des réseaux et des nœuds pour supprimer la dépendance à l'ordre de l'API.

### Vérification

- [2026-07-27 20:08] `npm run verify` vert.
- Validation navigateur effectuée sur http://127.0.0.1:5180/ : la carte affiche une topologie plus lisible et stable, avec les routes qui relient les placements de façon déterministe.
- Merge local sur `main` : `a44395830658d9a4f5350170f36faedbe70ee66a`.

### Validation

- Capture du viewport confirmant l'affichage des routes sur la carte.
