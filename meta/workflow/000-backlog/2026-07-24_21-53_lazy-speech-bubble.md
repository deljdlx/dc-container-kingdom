---
id: 2026-07-24_21-53
title: Bulle de dialogue — DOM paresseux
type: refactor
branch:
created: 2026-07-24 21:53
---

## Objectif

Créer la div `.quickReaction` au **premier** `showReaction()` plutôt qu'eager dans
le constructeur de `CharacterRenderer` — inutile pour les persos qui ne parlent
jamais. Petite optimisation d'hygiène, comportement inchangé.

## Contexte / liens

- `src/engine/map/Renderer/CharacterRenderer.js`
  (`_domQuickReaction`, `showReaction` / `clearReaction` / `isReactionVisible`)
- Tests bulle : `test/Character.test.js`

## Definition of Done

- [ ] `_domQuickReaction` créé à la demande (au 1er `showReaction`) ;
      `clearReaction` / `isReactionVisible` gèrent le cas « pas encore créé ».
- [ ] Comportement inchangé : les tests bulle passent **sans modifier** d'assertion
      (voir recipe `meta/agents/recipes/refactor-safely.md`).

## Vérification

- [ ] `npm run verify` vert
- [ ] bulle OK au navigateur (Cain dans la démo — `meta/recipes/verify-in-browser.md`)

## Journal

-
