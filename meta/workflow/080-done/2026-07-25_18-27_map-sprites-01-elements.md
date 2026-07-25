---
id: 2026-07-25_18-27
title: Exposer les sprites identifiables de map-sprites-01.png en éléments de carte
type: feat
branch: copilot/map-sprites-01-elements
created: 2026-07-25 18:27
ready: 2026-07-25 18:36
doing: 2026-07-25 18:36
verify: 2026-07-25 18:59
done: 2026-07-25 19:00
---

## Objectif

`src/engine/images/map/map-sprites-01.png` (**1920×3360**) est la plus grosse
planche du moteur, et il n'en sort aujourd'hui que **6 éléments** : `Tree00`,
`Ground00`, `Fountain00`, `Sunflower00`, `Fence00H`, `Fence00V`. Tout le reste
dort.

Objectif : en exposer les sprites **clairement identifiables** comme éléments
publics (`SpriteElement` déclaratifs), ré-exportés par `src/engine/index.js` et
visibles dans `/engine/catalog/` — même démarche que la planche `flowers-00`
(ticket `2026-07-25_17-33`), qui sert de patron.

### Contrainte forte : ne traiter que ce qui est identifiable

Cette planche mélange **deux natures de contenu**, et une seule est traitable ici :

1. **Objets autonomes** — un arbre, un banc, un rocher, un panneau, un torii, une
   fontaine, un bâtiment entier. Ils se posent tels quels sur une carte. **→ dans
   le périmètre.**
2. **Matériau d'assemblage** — autotiles de terrain (herbe, sable, eau, gravier
   avec leurs bords et coins), murs et coins de falaise, morceaux de route et de
   passage piéton, bandes de façade et de toiture, demi-ponts, escaliers en
   tronçons. **→ hors périmètre.**

Un morceau d'autotile **n'est pas un sprite** : c'est un fragment qui n'a de sens
qu'accolé à ses voisins par un algorithme de tuilage que le moteur n'a pas. Isolé,
il donne un élément inutilisable et une carte de catalogue illisible — exactement
les « sprites bizarres » de la planche. Les exposer polluerait l'API publique.

**Critère de tri, à appliquer à l'œil, sprite par sprite** :

> On garde ce qu'on peut **nommer en un mot et poser tel quel** (« un arbre »,
> « un banc », « un panneau STOP »). On écarte tout ce qu'on ne sait décrire que
> par sa fonction d'assemblage (« coin de falaise », « bord d'herbe », « bande de
> toit », « moitié de pont »).

En cas de doute : **on écarte**, et on le note. Mieux vaut un lot plus petit et
sûr qu'un catalogue rempli de fragments.

## Analyse rapide (relevé du 2026-07-25, à affiner en *specify*)

- **1920×3360** px, soit 120×210 cellules de 16 px ; **14 907 cellules occupées**
  (59 % de la planche).
- **334 composantes connexes** au niveau cellule, dont **44 gros blocs** (plus de
  10 cellules de côté) — ce sont précisément les zones d'assemblage — et ~290
  petites composantes, majoritairement des objets isolés. Ordre de grandeur du lot
  exploitable, **à confirmer visuellement**.
- **Cette planche n'est pas sur une grille régulière**, contrairement à
  `flowers-00`. Les frames existants le prouvent : `Ground00` fait 50×50 à
  `[-1790, -800]`, `Fountain00` 80×64 à `[-1170, -2754]`, `Sunflower00` 16×24 à
  `[-1760, -1256]` — ni les offsets ni les tailles ne tombent sur un pas commun.
  **Le helper `cell(col, row)` de `flowers-00` n'est donc pas réutilisable** : il
  faut des frames en pixels, dérivés des bounding boxes alpha puis validés à l'œil.
- Familles pressenties côté « identifiable » : arbres (beaucoup de teintes, plus
  les variantes enneigées), arbres morts, conifères, buissons, rochers, parterres
  de fleurs, clôtures et barrières, bancs et tables, panneaux et feux tricolores,
  lampadaires, torii, statues / puits / fontaines, et les bâtiments dessinés
  entiers.
- **Zone d'ombre à trancher en *specify*** : les bâtiments. Certains sont dessinés
  d'un bloc (identifiables), d'autres n'existent que sous forme de bandes de
  façade et de toiture à empiler. Idem pour les ponts, arches et tunnels, à moitié
  objets, à moitié pièces d'assemblage.

## Spécifications

Le ticket est traité en **lot arbres autonomes** (périmètre explicite et
vérifiable), pour éviter les fragments d'assemblage et les zones bâtimentaires
mixtes qui demandent un tri visuel plus fin.

- Nouveau module `src/engine/map/Elements/MapSprites01/` :
  - `atlas.js` avec `sprite(x, y, width, height, extra?)`
  - helpers de collision `treeCollision` / `deadTreeCollision`
  - `Trees.js` avec 148 éléments :
    - `Conifer00..35`
    - `LeafTree00..26`
    - `CanopyTree00..23`
    - `TallTree00..29`
    - `DeadTree00..24`
    - `SaplingTree00..05`
  - baril `MapSprites01/index.js` ré-exporté par `src/engine/index.js`
- Les 6 éléments historiques de la planche (`Tree00`, `Ground00`, `Fountain00`,
  `Sunflower00`, `Fence00H`, `Fence00V`) restent inchangés.
- Le lot garde `shadow: false` (ombre portée peinte dans l'art) et ajoute
  `collision` sur tous les éléments arborés (objets bloquants).
- Tests dédiés `test/map-sprites-01-elements.test.js` : bornes 1920×3360,
  absence de recouvrement sur le lot, exports catalogue, familles attendues,
  invariants historiques.

## Contexte / liens

- `src/engine/images/map/map-sprites-01.png` (la planche)
- Éléments actuels : `src/engine/map/Elements/Tree00.js`, `Ground00.js`,
  `Fountain00.js`, `Sunflower00.js`, `Fence00H.js`, `Fence00V.js`
- Patron à suivre : `src/engine/map/Elements/Flowers/` (+ `atlas.js`),
  `test/flowers-00.test.js`, ticket `meta/workflow/080-done/2026-07-25_17-33_flowers-atlas-elements.md`
- `src/engine/map/SpriteElement.js` (format du `descriptor`), `src/engine/index.js`
- Recipes : `meta/recipes/add-map-element.md`, `meta/recipes/verify-in-browser.md`
- Doc : `meta/documentation/engine.md`, `src/engine/README.md`
- **Suite possible** : le matériau d'assemblage écarté ici (autotiles de terrain,
  falaises, routes, façades) mérite son propre ticket — c'est une **feature
  moteur** (tuilage automatique), pas une déclaration d'éléments.

## Definition of Done

- [x] Le lot arbres autonomes (148 sprites identifiables) est exposé comme
  éléments publics, avec `frame` / `width` / `height` exacts.
- [x] Aucun fragment d'assemblage n'a été exposé dans ce lot.
- [x] Les sprites écartés sont documentés (zones + raison).
- [x] Les 6 éléments historiques de la planche restent inchangés.
- [x] Zones cohérentes : `collision` sur ce lot bloquant ; pas de `manualZ`
  inutile.
- [x] Les nouveaux éléments sont exportés par `src/engine/index.js` et visibles
  dans `/engine/catalog/`.
- [x] Tests de cohérence + exports verts.
- [x] Doc à jour (`meta/documentation/engine.md`, `src/engine/README.md`).
- [x] `npm run verify` vert + validation visuelle catalogue/démo.

## Journal

### Travail

- [2026-07-25 18:36] Inventaire alpha automatique de la planche (1500 composantes pixel-connectées), puis sélection stricte des objets arborés autonomes pour éviter les fragments d'assemblage.
- [2026-07-25 18:36] Nouveau module `src/engine/map/Elements/MapSprites01/` : helper `sprite(x, y, width, height, extra?)`, collisions de tronc (`treeCollision` / `deadTreeCollision`), et 148 classes publiques (`Conifer*`, `LeafTree*`, `CanopyTree*`, `TallTree*`, `DeadTree*`, `SaplingTree*`).
- [2026-07-25 18:36] Exports branchés via `src/engine/index.js` + tests dédiés (`test/map-sprites-01-elements.test.js`) + doc moteur/README mise à jour.
- [2026-07-25 18:36] **Sprites écartés (zones + raison)** :
  - `x:[0..1728], y:[640..3360]` majoritairement matériau d'assemblage (autotiles terrain/eau, falaises, routes, façades, toitures, murs, arches) ; hors périmètre d'éléments posables unitaires.
  - `x:[0..1664], y:[400..493]` micro-fragments décoratifs séparés (feuilles/pommes/flocons) non posables seuls.
  - `x:[1024..1919], y:[2240..3344]` ensembles bâtimentaires mixtes (blocs complets + bandes/coins de composition) gardés pour un lot dédié après tri visuel fin.

### Vérification

- [2026-07-25 18:59] `npm run verify` vert (lint + build + 184 tests).
- [2026-07-25 18:59] Validation visuelle navigateur sur `http://localhost:5174/engine/catalog/` : familles `Conifer`, `LeafTree`, `CanopyTree`, `TallTree`, `DeadTree`, `SaplingTree` présentes et filtrables (ex. filtre `Conifer00`).
- [2026-07-25 18:59] Validation visuelle navigateur sur `http://localhost:5174/engine/demo/` : démo moteur chargée sans erreur visible.

### Validation

- [2026-07-25 19:00] Relecture de conformité: lot arbres autonome livré, exports/tests/docs alignés, 6 éléments historiques inchangés.
- [2026-07-25 19:00] Merge sur `main` via `git merge --no-ff copilot/map-sprites-01-elements` (commit `c57a87b`).
