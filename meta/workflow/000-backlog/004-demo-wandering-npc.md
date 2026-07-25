---
id: 004
title: Démo — un PNJ en errance (CharacterBehavior)
type: chore
branch:
created: 2026-07-24
---

## Objectif

Exercer le behavior d'errance (aujourd'hui dormant) en ajoutant **un** PNJ qui
erre dans la démo, en plus des patrouilleurs et du fuyard. Petit ajout démo.

## Contexte / liens

- `src/engine/demo/demo.js`
- `src/engine/map/CharacterBehavior.js` (`.live(...)`), exporté par `src/engine/index.js`
- Recipe projet : `meta/recipes/add-npc-behavior.md`

## Definition of Done

- [ ] Un PNJ instancié dans la démo avec `CharacterBehavior` actif (errance visible).
- [ ] Pas de régression (foule + collisions toujours OK).

## Vérification

- [ ] `npm run verify` vert
- [ ] errance visible au navigateur (pilotage manuel rAF si l'onglet est en fond —
      `meta/recipes/verify-in-browser.md`)

## Journal

-
