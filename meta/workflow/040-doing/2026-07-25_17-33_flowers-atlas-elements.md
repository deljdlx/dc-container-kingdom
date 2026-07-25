---
id: 2026-07-25_17-33
title: Exposer les sprites de flowers-00.png en éléments de carte
type: feat
branch: claude/flowers-atlas-elements
created: 2026-07-25 17:33
ready: 2026-07-25 17:51
doing: 2026-07-25 17:53
verify:
done:
---

## Objectif

La planche `src/engine/images/map/flowers-00.png` (512×512) contient **219
sprites** de décor végétal — fleurs, buissons, champignons, nénuphars, herbes,
tapis fleuris, plus quelques objets (puits, dalles, souche, tronc). Le moteur
n'en expose **qu'un seul** aujourd'hui : `Flower00`. Tout le reste est inutilisé.

Objectif : **exposer cette planche comme éléments de carte publics** du moteur
(`SpriteElement` déclaratifs), ré-exportés par `src/engine/index.js`, donc
visibles dans le **catalogue** et réutilisables par la démo et Container Kingdom.
Enjeu : donner de la variété visuelle aux cartes sans nouvel asset.

## Analyse de la planche (relevé automatique + validation visuelle, 2026-07-25)

Atlas **512×512**, grille **32 px** → 16×16 = 256 cellules, dont **240 occupées**
(16 vides ou traces de quelques pixels, ignorées).

Le premier relevé automatique (regroupement des cellules dont l'encre traverse la
couture) proposait 165 unités dont 25 multi-cellules. **La validation visuelle
sprite par sprite invalide presque toutes ces fusions** : nénuphars, bandes
d'herbe, massifs et troncs se *touchent* sans former une unité. Segmentation
retenue :

| Taille | Nb |
|---|---|
| 32×32 | 212 |
| 64×64 | 7 (les champs de fleurs) |
| **total** | **219 unités / 240 cellules** |

Les 7 seules unités multi-cellules sont les **champs de fleurs 64×64** (même art
décliné en 7 teintes), repérables à leur signature d'encre par quadrant
(680/790/778/775) — cellule haut-gauche : `(14,9)` jaune, `(11,10)` orange,
`(13,11)` lavande, `(7,12)` blanc, `(9,12)` bleu, `(7,14)` rose, `(9,14)` violet.

### Familles retenues (29)

Nommage **famille + index** (convention existante `House00`, `Man00`), index en
ordre de lecture (ligne puis colonne) :

| Famille | Nb | Note |
|---|---|---|
| `Blossom` | 14 | petits buissons fleuris en rosette |
| `Tulip` | 5 | fleurs dressées |
| `Flower` | 6 | buisson fleuri dense — `Flower00` **existant**, cellule (0,3) |
| `FlowerPatch` | 5 | tapis fleuri dense → `manualZ` |
| `Mushroom` | 11 | amas de petits champignons ronds |
| `Toadstool` | 4 | bouquets de champignons à pied fin |
| `Plant` | 12 | feuillages verts (herbes, fougères) |
| `DryPlant` | 6 | feuillages secs / blé |
| `Stump` | 2 | souche nue, souche moussue → `collision` |
| `LilyPad` | 16 | nénuphars sans fleur |
| `WaterLily` | 8 | nénuphars fleuris |
| `Lupin` | 10 | fleurs en épi (5 teintes × 2 tailles) |
| `FlowerSprig` | 13 | petites touffes de 3 à 5 fleurs |
| `Hosta` | 8 | grandes feuilles + une grosse fleur |
| `FlowerCluster` | 14 | massifs lâches (7 teintes × 2 tailles) |
| `FlowerMound` | 6 | massifs denses en monticule |
| `Bouquet` | 10 | bouquets ronds compacts |
| `FlowerBunch` | 10 | bouquets lâches à grosses corolles |
| `Rose` | 8 | quatre grosses roses |
| `FlowerBed` | 7 | parterres en quinconce |
| `GiantMushroom` | 10 | gros champignon isolé (chapeau + pied) |
| `Rock` | 4 | rochers / géodes → `collision` |
| `Petals` | 6 | pétales épars (particules) |
| `FlowerGrass` | 6 | bandes d'herbe fleurie tuilables → `manualZ` |
| `StoneSlab` | 1 | dalles de pierre → `manualZ` |
| `Well` | 1 | puits → `collision` |
| `HollowLog` | 3 | troncs creux moussus → `collision` |
| `StemFlower` | 6 | fleur unique sur tige |
| `FlowerField` | 7 | champs de fleurs **64×64** |

## Spécifications

### Fonctionnel

- 219 éléments publics posables sur une `Area`, dont 218 nouveaux.
- Le décor est **traversable** par défaut ; seuls puits, souches, troncs creux et
  rochers bloquent.
- Tapis (`FlowerGrass`, `FlowerPatch`) et dalles (`StoneSlab`) sont des **sols** :
  `manualZ`, donc jamais triés en profondeur par leur `y`.
- Le **catalogue** `/engine/catalog/` reste utilisable à ~232 cartes : sections par
  famille, filtre de recherche, compteur juste.

### Technique

- **Source unique de vérité** : les classes elles-mêmes, déclarées **une par
  ligne** à partir d'un helper `cell(col, row, extra?)` qui dérive le
  `background-position` de la cellule (`frame = [-col*32, -row*32]`). Pas de
  fabrique dynamique : les classes restent statiques, greppables et exportées
  nommément, donc la frontière moteur et le catalogue (dérivé du baril) sont
  inchangés.
- Découpage par thème sous `src/engine/map/Elements/Flowers/` :
  `atlas.js` (helper), `Blossoms.js`, `Clusters.js`, `Fields.js`, `Foliage.js`,
  `Mushrooms.js`, `Water.js`, `Props.js`, `index.js` (baril de la planche),
  ré-exporté par `src/engine/index.js`.
- `Flower00.js` disparaît au profit d'une déclaration dans `Blossoms.js` **au
  descripteur identique** (nom, `frame [0, -96]`, `trigger`, ombre par défaut) :
  l'API publique ne bouge pas.
- **Ombres** : l'ombre portée est peinte dans le pixel-art → `shadow: false` sur
  toute la planche, sauf `Flower00` (inchangé).
- **Zones** : aucune par défaut. `collision` sur `Well00`, `Stump00/01`,
  `HollowLog00..02`, `Rock00..03`. Aucun nouveau `trigger` (narrow phase).
- **Tests** : cohérence de la planche (frames dans les bornes 512×512, multiples
  de 32, pas de doublon de frame, pas de chevauchement entre unités), export par
  le baril, `Flower00` inchangé, catalogue non vide et groupable.
- **Lotissement** : un commit par lot de familles.

### Risques / questions ouvertes

- ~~Nommage~~ → tranché : famille + index.
- ~~Périmètre~~ → tranché : toute la planche.
- ~~UX catalogue~~ → tranché : filtre + regroupement dans ce ticket.
- Les 6 `Petals` (65 px d'encre) restent des éléments publics : utiles comme
  particules posées, coût nul.

## Contexte / liens

- `src/engine/images/map/flowers-00.png` (l'atlas)
- `src/engine/map/Elements/Flowers/Flower00.js` (seul élément actuel de la planche)
- `src/engine/map/SpriteElement.js` (format du `descriptor`)
- `src/engine/index.js` (baril — frontière moteur)
- `src/engine/catalog/` + `src/engine/catalog/catalog-registry.js`, `test/catalog-registry.test.js`
- Recipes : `meta/recipes/add-map-element.md`, `meta/recipes/verify-in-browser.md`
- Doc : `meta/documentation/engine.md`, `src/engine/README.md`

## Definition of Done

- [ ] Les 219 sprites de `flowers-00.png` sont exposés comme éléments publics du
      moteur, avec `frame` / `width` / `height` **exacts** (vérifiés visuellement,
      aucun sprite tronqué ni débordant sur son voisin).
- [ ] Zones cohérentes : `collision` sur ce qui bloque, `manualZ` sur les tapis,
      rien par défaut sur le décor traversable.
- [ ] `Flower00` reste inchangé (nom, offset, zone, ombre).
- [ ] Tous les nouveaux éléments sont exportés par `src/engine/index.js` et
      apparaissent dans `/engine/catalog/`, qui reste **lisible et fluide** à cette
      échelle (regroupement / filtre, compteur juste).
- [ ] Tests de cohérence de la planche + exports verts.
- [ ] Doc à jour (`meta/documentation/engine.md`, `src/engine/README.md`, et
      `meta/recipes/add-map-element.md` si la façon d'ajouter un élément change).
- [ ] `npm run verify` vert + validation visuelle au navigateur (catalogue, et
      démo pour un échantillon posé sur une area).

## Journal

### Travail

-

### Vérification

-

### Validation

-
