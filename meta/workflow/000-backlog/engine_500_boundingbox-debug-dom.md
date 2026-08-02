---
id: 2026-08-02_20-54
title: BoundingBox fait des maths et du DOM de debug
type: refactor
branch:
created: 2026-08-02 20:54
ready:
doing:
verify:
done:
---

## Objectif

`src/engine/scene/BoundingBox.js` (281 lignes) est **la primitive géométrique du
moteur** — intersections, boîtes agrégées. Elle porte aussi un champ `dom` et
fait `this.dom.classList.toggle('collided', value)` dans `collided()`. La
géométrie pure et l'affichage de debug vivent dans la même classe.

Ce n'est pas un bug aujourd'hui : hors debug le champ `dom` est absent, et le `if`
protège. C'est une gêne qui se paiera au moment précis où la géométrie deviendra
chaude — la **collision par paires** (étape 4) voudra faire de la géométrie **par
lots, hors DOM** (balayage continu, grille spatiale), et une primitive qui touche
`classList` à chaque changement d'état ne se prête ni au batch ni au test sans
jsdom.

## Spécifications

_À confirmer en « specify »._

- **Extraire le rendu de debug** : un observateur du drapeau `collided`, comme la
  console d'events observe le bus — la primitive redevient pure.
- **Ou assumer** et l'écrire, en mesurant ce que coûte le `if` sur un chemin
  chaud.

## Contexte / liens

- Origine : audit du noyau moteur du 2026-08-02, candidat trié le même jour.
- `src/engine/scene/BoundingBox.js` — champ `dom`, méthode `collided()`.
- `src/engine/render/Renderer.js` — `renderCollisionZones()`, qui crée ces boîtes.
- Étape 4 de la feuille de route (collision par paires).

## Definition of Done

- [ ] `BoundingBox` **ne touche plus le DOM** (ou la décision inverse est écrite
      avec sa mesure).
- [ ] Les zones s'allument toujours **en magenta au contact** sous `?debug=1` —
      vérifié à l'écran, c'est le comportement qui fait foi.
- [ ] La géométrie se teste **sans jsdom** (test en environnement `node`).
- [ ] `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
