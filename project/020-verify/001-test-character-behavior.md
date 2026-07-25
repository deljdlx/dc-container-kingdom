---
id: 001
title: Test déterministe pour CharacterBehavior (errance)
type: test
branch: test/character-behavior
created: 2026-07-24
---

## Objectif

Couvrir le behavior d'errance `CharacterBehavior` par un test déterministe — c'est
le seul behavior sans test (`PatrolBehavior` et `FleeBehavior` en ont). Tâche
**test-only** : zéro risque runtime.

## Contexte / liens

- `src/engine/map/CharacterBehavior.js`
- Modèles : `test/PatrolBehavior.test.js`, `test/FleeBehavior.test.js`
- Recipe : `agents/recipes/implement-a-feature.md`

## Definition of Done

- [x] `test/CharacterBehavior.test.js` : faux personnage duck-typé, appels directs
      `_step()` / `update(dt)` ; vérifie la cadence (accumulation de `dt`) et le
      choix d'une nouvelle direction sur collision.

## Vérification

- [x] `npm run verify` vert

## Journal

- Test ajouté (`test/CharacterBehavior.test.js`, 3 cas : cadence de `update(dt)`,
  direction initiale quand vivant, nouvelle direction sur collision) avec
  `Math.random` stubé pour le déterminisme. `npm run verify` vert (116 tests).
