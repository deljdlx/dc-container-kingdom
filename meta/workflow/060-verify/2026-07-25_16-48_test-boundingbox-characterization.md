---
id: 2026-07-25_16-48
title: Tests de caractérisation pour BoundingBox
type: test
branch: copilot/test-boundingbox-characterization
created: 2026-07-25 16:48
ready: 2026-07-25 16:54
doing: 2026-07-25 16:54
verify: 2026-07-25 16:54
done:
---

## Objectif

`src/engine/map/BoundingBox.js` porte la logique de boîte englobante (collisions,
profondeur) mais n'a aucun test. Ajouter des **tests de caractérisation** pour figer
son comportement actuel avant tout refactor.

## Spécifications

- Nouveau fichier `test/BoundingBox.test.js` couvrant l'API publique de `BoundingBox`
  (cas nominaux + bords évidents), **sans modifier** `BoundingBox.js`.
- S'aligner sur le style des tests existants (Vitest, `test/*.test.js`).

## Contexte / liens

- `src/engine/map/BoundingBox.js` (sujet, lecture seule)
- `test/` (ex. `test/Element.test.js` pour le style)
- **Parallèle-safe** : ne crée que `test/BoundingBox.test.js` — disjoint des autres.

## Definition of Done

- [x] `test/BoundingBox.test.js` ajouté, `BoundingBox.js` inchangé.
- [x] `npm run verify` vert (nouveaux tests inclus).

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-25 16:54] Ajout de `test/BoundingBox.test.js` avec 13 tests de caractérisation couvrant l'API publique de `BoundingBox` (construction, accesseurs, `collided`, offsets, extension de boîte, overlap), sans modifier `src/engine/map/BoundingBox.js`.
- [2026-07-25 16:54] Ajustement des assertions de bords pour coller au comportement actuel observé (gestion des `null` via setters et `height(0)` qui n'écrase pas `y1`).

### Vérification

- [2026-07-25 16:54] `npm test -- test/BoundingBox.test.js` vert (13/13).
- [2026-07-25 16:54] `npm run verify` vert (lint + build + 168 tests).

### Validation

-
