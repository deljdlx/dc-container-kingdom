---
id: 2026-07-24_21-53
title: Bulle de dialogue — DOM paresseux
type: refactor
branch:
created: 2026-07-24 21:53
ready: 2026-07-25 13:40
---

## Objectif

Créer la div `.quickReaction` au **premier** `showReaction()` plutôt qu'eager dans
le constructeur de `CharacterRenderer` — inutile pour les persos qui ne parlent
jamais. Petite optimisation d'hygiène, comportement inchangé.

## Contexte / liens

- `src/engine/map/Renderer/CharacterRenderer.js`
  (`_domQuickReaction`, `showReaction` / `clearReaction` / `isReactionVisible`)
- Tests bulle : `test/Character.test.js`

## Spécifications

- Accesseur privé `_ensureQuickReaction()` : crée + `append` le nœud au premier
  appel, le retourne ensuite ; seul `showReaction()` l'emprunte.
- `clearReaction()` : sortie anticipée tant que le nœud n'existe pas.
- `isReactionVisible()` : `false` tant que le nœud n'existe pas.
- Points de vigilance (risques de changement de comportement observable) :
  - **ordre DOM** — `Renderer.addShadow()` fait un `prepend`, la bulle doit rester
    le dernier enfant comme aujourd'hui (empilement des absolus) ;
  - **CSS** — `src/engine/css/character.css` ne doit cibler `.quickReaction` que
    par classe, sans sélecteur positionnel (`:nth-child`, `+`, `~`).
- Filet : ne pas toucher aux assertions existantes ; ajouter un test de
  caractérisation sur l'absence du nœud avant la première prise de parole.

## Definition of Done

- [ ] `_domQuickReaction` créé à la demande (au 1er `showReaction`) ;
      `clearReaction` / `isReactionVisible` gèrent le cas « pas encore créé ».
- [ ] Comportement inchangé : les tests bulle passent **sans modifier** d'assertion
      (voir recipe `meta/agents/recipes/refactor-safely.md`).
- [ ] Test neuf : pas de `.quickReaction` dans le DOM avant le 1er `showReaction`.
- [ ] JSDoc du champ `_domQuickReaction` à jour (création paresseuse).

## Vérification

- [ ] `npm run verify` vert
- [ ] bulle OK au navigateur (Cain dans la démo —
      `meta/agents/recipes/verify-a-change.md`)

## Journal

-
