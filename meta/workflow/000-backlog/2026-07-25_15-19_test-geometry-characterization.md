---
id: 2026-07-25_15-19
title: Tests de caractérisation pour Geometry
type: test
branch:
created: 2026-07-25 15:19
ready:
doing:
verify:
done:
---

## Objectif

`src/engine/map/Geometry.js` n'a aucun test alors qu'il porte de la logique
géométrique réutilisée par le moteur. Ajouter des **tests de caractérisation**
(figer le comportement actuel) pour sécuriser les futurs refactors.

## Spécifications

- Nouveau fichier `test/Geometry.test.js` couvrant l'API publique de `Geometry`
  (cas nominaux + bords évidents), **sans modifier** `Geometry.js`.
- S'aligner sur le style des tests existants (Vitest, `test/*.test.js`).

## Contexte / liens

- `src/engine/map/Geometry.js` (sujet, lecture seule)
- `test/` (style des tests existants, ex. `test/Element.test.js`)
- **Parallèle-safe** : ne crée que `test/Geometry.test.js` — disjoint des autres
  tickets de test parallèle.

## Definition of Done

- [x] `test/Geometry.test.js` ajouté, `Geometry.js` inchangé.
- [x] `npm run verify` vert (nouveaux tests inclus).

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-25 16:11] Créé worktree copilot ; branche copilot/test-geometry.
- [2026-07-25 16:11] Écrit test/Geometry.test.js : 32 tests couvrant l'API publique (construction, width/height, x/y, add(), clone()).
- [2026-07-25 16:11] Corrigé test pour add() avec null : vérifie la coercion JavaScript (null + 10 = 10).

### Vérification

- [2026-07-25 16:11] npm run verify : lint ✅, build ✅, tests ✅ (155 tests dont 32 pour Geometry).
- [2026-07-25 16:11] Geometry.js inchangé, disjoint des autres tickets.

### Validation

- [2026-07-25 16:11] Tous les cas nominaux + bords testés : defaults, getters/setters, arrondi, clone, add() avec axes invalides.
