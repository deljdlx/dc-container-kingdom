---
id: 2026-07-25_16-48
title: Tests de caractérisation pour BoundingBox
type: test
branch:
created: 2026-07-25 16:48
ready:
doing:
verify:
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

- [ ] `test/BoundingBox.test.js` ajouté, `BoundingBox.js` inchangé.
- [ ] `npm run verify` vert (nouveaux tests inclus).

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
