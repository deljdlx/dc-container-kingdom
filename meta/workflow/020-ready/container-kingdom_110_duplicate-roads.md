---
id: 2026-07-27_17-37
title: Routes en double — le tracé des réseaux empile des segments au même endroit
type: fix
branch:
created: 2026-07-27 17:37
ready: 2026-07-27 18:45
doing:
verify: 
done:
---

## Objectif

Les routes se **superposent** : plusieurs éléments `Ground00` sont créés aux
mêmes coordonnées, empilés les uns sur les autres. D'où l'aspect « routes en
double » — jonctions plus épaisses ou plus sombres, tracés qui se doublent au
lieu de fusionner.

Trois causes cumulées, lues dans `ContainerKingdomRenderer.drawNetworks()` :

### 1. Aucune déduplication à la création

`drawRoad()` crée **toujours** un nouvel élément et l'ajoute à l'aire et à
`_networkElements`. La `RoadMatrix` n'est consultée **qu'après** :
`roadsMatrix.add(x, y, road)` **écrase** l'entrée de la `Map` pour cette case —
la matrice ne garde donc que la dernière route, pendant que **toutes** les
précédentes restent dans le graphe de scène et dans le DOM.

`roadsMatrix.has(x, y)` existe déjà et n'est jamais appelé avant de dessiner.

### 2. Un réseau est tracé comme une chaîne, dans un ordre arbitraire

Chaque réseau relie ses conteneurs en **chaîne** — `[0]→[1]→[2]→…` — et chaque
saut est un **L** (horizontal puis vertical). L'ordre est celui de
`Object.values(this.containers)`, c'est-à-dire l'ordre de l'API Docker : rien de
spatial. Une chaîne qui traverse la carte dans un ordre quelconque **repasse sur
ses propres segments**.

Mesuré sur les fixtures (35 conteneurs, 4 réseaux) : le réseau **`web` compte 32
conteneurs**, soit **31 sauts en L** tracés à travers toute la carte. Les autres
sont marginaux (`mariadb` 7, `docker-api` 2, `umami` 2).

### 3. Un conteneur multi-réseaux appartient à plusieurs chaînes

`_rebuildNetworks()` pousse chaque conteneur dans **chacun** de ses réseaux : il
est donc un nœud de plusieurs chaînes, et les tronçons communs sont retracés une
fois par réseau. **8 conteneurs sur 35** sont sur au moins deux réseaux dans les
fixtures.

### Ce qui n'est pas en cause

Les **arbres** ne sont pas dupliqués : `drawRoadTrees()` itère sur
`matrix.tiles()`, donc sur les cases **dédupliquées** par la `Map`. Le bug est
strictement sur les routes.

## Spécifications

_Rempli en « specify » (voir la recipe)._

### ⚠️ Piège à ne pas manquer : dédupliquer casse le filtre par réseau

Chaque route porte **une seule** classe `network--<nom>` (`drawRoad()`), et
`KingdomHud.handleNetworkSwitch()` masque `.network--<nom>`. Aujourd'hui, une
route partagée entre deux réseaux existe **en double**, une copie par réseau :
éteindre un réseau laisse l'autre copie visible. Ça marche — **par accident, et
grâce au bug**.

Dédupliquer naïvement (un seul élément, une seule classe) ferait donc
**disparaître des tronçons encore utilisés** dès qu'on éteint un réseau. Une
route doit porter **tous** les réseaux qui l'empruntent, et n'être masquée que
lorsqu'ils sont **tous** éteints.

Le patron existe déjà **dans le même fichier**, pour les maisons :
`handleNetworkSwitch()` calcule un `mustBeHidden` en parcourant les réseaux du
conteneur. Les routes doivent suivre la même logique.

### À arbitrer en *specify*

- **Périmètre.** Deux problèmes distincts vivent ici : la **superposition**
  (défaut net, correction locale) et la **topologie** en chaîne d'ordre
  arbitraire (choix de conception : tronc commun, étoile, arbre couvrant
  minimal…). Traiter la superposition seule est déjà une amélioration visible ;
  la topologie mérite peut-être son propre ticket. **Découper est une réponse
  valable.**
- **Sémantique visuelle** d'une route partagée : couleur du premier réseau,
  neutre, ou marquage spécifique ? Aujourd'hui c'est le **dernier réseau tracé**
  qui gagne, ce qui est arbitraire.

### Décision de périmètre (specify)

- Ce ticket corrige la **superposition** (une seule route par case) et rend les
      routes **multi-réseaux** compatibles avec le filtre de réseau.
- La **topologie** des tracés (chaîne d'ordre API vs heuristique spatiale) est
      reportée dans un ticket dédié de follow-up, car c'est un changement de
      conception séparé du bug de duplication.

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdomRenderer.js` — `drawNetworks()`,
  `drawHorizontalRoads()`, `drawVerticalRoads()`, `drawRoad()`, `drawRoadTrees()`
- `src/container-kingdom/js/RoadMatrix.js` — `has()` existe, jamais utilisé pour
  éviter un doublon
- `src/container-kingdom/js/KingdomHud.js` — `handleNetworkSwitch()`, et le
  patron `mustBeHidden` déjà en place pour les conteneurs
- `src/container-kingdom/js/ContainerRepository.js` — `_rebuildNetworks()`
- Précédent : `2026-07-26_14-26` (durcissement du tracé maisons/routes), qui a
  déjà corrigé la `RoadMatrix` (clés numériques) sans toucher aux doublons.

## Definition of Done

- [ ] Le **taux de superposition est mesuré avant et après** (nombre d'éléments
      de route créés vs nombre de cases distinctes occupées) — le gain est
      chiffré, pas affirmé.
- [ ] Aucune case ne porte plus d'un élément de route.
- [ ] Le filtre par réseau reste **correct** : éteindre un réseau ne fait pas
      disparaître un tronçon emprunté par un autre — preuve automatisée.
- [ ] Le comportement est couvert par des tests sur la **logique** (occupation
      des cases, appartenance multi-réseaux), pas sur le DOM.
- [ ] Décision tracée dans le ticket sur la topologie : corrigée ici, ou
      renvoyée vers un ticket dédié.
- [ ] Vérifié **au navigateur** — c'est un défaut visuel, les tests ne suffisent
      pas à conclure.
- [ ] `npm run verify` vert ; doc à jour si le tracé change
      (`meta/documentation/container-kingdom.md`).

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
