---
id: 001
title: Test déterministe pour CharacterBehavior (errance)
type: test
branch:
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

- [ ] `test/CharacterBehavior.test.js` : faux personnage duck-typé, appels directs
      `_step()` / `update(dt)` ; vérifie la cadence (accumulation de `dt`) et le
      choix d'une nouvelle direction sur collision.

## Vérification

- [ ] `npm run verify` vert

## Journal

-
