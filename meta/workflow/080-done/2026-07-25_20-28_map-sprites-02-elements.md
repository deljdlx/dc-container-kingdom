---
id: 2026-07-25_20-28
title: Exposer les sprites identifiables de map-sprites-02.png en éléments de carte
type: feat
branch: copilot/map-sprites-02-elements
created: 2026-07-25 20:28
ready: 2026-07-25 21:18
doing: 2026-07-25 21:18
verify: 2026-07-25 21:22
done: 2026-07-25 21:31
---

## Objectif

Faire la même démarche que pour `map-sprites-01.png` sur
`src/engine/images/map/map-sprites-02.png` : exposer les sprites clairement
identifiables en éléments publics du moteur (`SpriteElement` déclaratifs),
ré-exportés par `src/engine/index.js` et visibles dans `/engine/catalog/`.

Ce ticket couvre un **premier lot**: les sprites autonomes de végétation
visiblement posables du coin supérieur gauche de la planche (arbres, petits
arbres, troncs / souches, buissons lisibles). Le reste de la planche, plus loin
dans l'atlas, sera loti séparément quand le tri visuel sera suffisamment sûr.

## Spécifications

### Périmètre

- Inclure uniquement les objets autonomes posables tels quels sur une carte
  (ici: végétation autonome du coin supérieur gauche de la planche, de type
  arbres, souches, petits arbustes lisibles).
- Exclure les fragments d'assemblage (autotiles, bords/coins, bandes de façade,
  toitures en tronçons, routes à composer, falaises modulaires, etc.).
- En cas de doute sur un sprite, l'écarter et tracer ce choix dans la section
  dédiée des sprites exclus.

### Technique

- Créer un module dédié sous `src/engine/map/Elements/MapSprites02/`.
- Utiliser un helper de type `sprite(x, y, width, height, extra?)` (atlas
  irrégulier, pas de grille fiable de cellules).
- Nommer les classes par famille + index (`<Family><NN>`) en ordre de lecture;
  pour ce lot, conserver une famille simple et lisible de végétation (`Tree`,
  `Stump`, `Bush` si nécessaire) plutôt qu'un nommage trop fin ou spéculatif.
- Ré-exporter le baril de planche depuis `src/engine/index.js`.
- Garder les ombres cohérentes avec l'art source (`shadow: false` quand l'ombre
  est déjà peinte), et appliquer `collision` uniquement sur les objets bloquants.

### Qualité / vérification

- Ajouter des tests de cohérence (bornes atlas, absence de recouvrement sur le
  lot retenu, exports présents, invariants historiques si éléments existants).
- Vérifier la présence dans le catalogue `/engine/catalog/` et la lisibilité du
  lot ajouté.
- Exécuter `npm run verify`.

### Sprites exclus

- `x:[0..700], y:[0..500]` minuscules fragments décoratifs, buissons trop fins
  ou pièces ambigües du sommet de la planche : exclus de ce lot car ils ne sont
  pas encore lisibles comme objets autonomes sûrs.
- `x:[688..1919], y:[0..3360]` reste de la planche (bâtiments, routes, falaises,
  façades, toitures, eaux et autres pièces d'assemblage) : hors périmètre de ce
  premier lot car il faudra un tri visuel séparé par familles.

## Contexte / liens

- Planche source: `src/engine/images/map/map-sprites-02.png`
- Patron proche: ticket done
  `meta/workflow/080-done/2026-07-25_18-27_map-sprites-01-elements.md`
- Moteur: `src/engine/map/SpriteElement.js`, `src/engine/index.js`
- Recettes: `meta/recipes/add-map-element.md`,
  `meta/recipes/verify-in-browser.md`

## Definition of Done

- [x] Un premier lot de sprites clairement identifiables de `map-sprites-02.png`
      est exposé comme éléments publics avec `frame` / `width` / `height`
      exacts.
- [x] Aucun fragment d'assemblage n'est exposé dans le lot livré.
- [x] Les sprites écartés sont explicitement documentés (zone + raison).
- [x] Les éléments exportés sont visibles et filtrables dans `/engine/catalog/`.
- [x] Tests ajoutés/ajustés et verts.
- [x] Documentation mise à jour (`meta/documentation/engine.md`,
      `src/engine/README.md`).
- [x] `npm run verify` vert et validation visuelle navigateur réalisée.

## Journal

### Travail

- [2026-07-25 21:18] Recalage du ticket pour un premier lot de végétation autonome du coin supérieur gauche de `map-sprites-02.png`.
- [2026-07-25 21:18] Choix d'un nommage simple et lisible pour ce lot (`Tree`, éventuellement `Stump` / `Bush` si nécessaire), afin de garder l'API publique greppables et de laisser les fragments d'assemblage hors périmètre.
- [2026-07-25 21:18] Inventaire visuel et sélection conservatrice des 30 silhouettes arborées les plus lisibles (`Tree01..Tree30`) pour ce premier lot.
- [2026-07-25 21:22] Ajout du module `src/engine/map/Elements/MapSprites02/` (helper pixel + 30 `TreeNN`) et export via `src/engine/index.js`.

### Vérification

- [2026-07-25 21:22] Test ciblé `test/map-sprites-02-elements.test.js` vert (6/6).
- [2026-07-25 21:30] `npm run verify` vert (24 fichiers, 190 tests).

### Validation

- [2026-07-25 21:31] Validation navigateur sur `/engine/catalog/` et `/engine/demo/` effectuée: le lot `Tree01..Tree30` est indexé dans le catalogue et la démo se charge correctement.