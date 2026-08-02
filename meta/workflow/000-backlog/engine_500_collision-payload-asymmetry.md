---
id: 2026-08-02_20-53
title: Le payload de collision ne dit pas la même chose au début et à la fin
type: fix
branch:
created: 2026-08-02 20:53
ready:
doing:
verify:
done:
---

## Objectif

Mesuré en câblant le catalogue d'events (`2026-08-02_19-30`) :

- sur un **début** de contact, les deux éléments reçoivent le **détecteur** dans
  `element` — `CollisionSystem` passe le même payload aux deux ;
- sur une **fin**, chacun se reçoit **lui-même**.

Un abonné qui lit `event.element` obtient donc deux choses différentes selon la
phase. L'enveloppe ajoute `source`, sans ambiguïté, mais les clés historiques
restent — et restent contradictoires. Documenté en ⚠️ dans `engine.md` §9.

Aucune régression aujourd'hui (rien ne lit ces clés hors de la démo). Mais c'est
un piège posé pour le premier système qui fera **« qui a touché qui »** — soit
exactement le système de dégâts que les projectiles appellent, et la collision par
paires de l'étape 4.

## Spécifications

_À confirmer en « specify »._ Deux issues :

- **Aligner les deux phases** : chaque côté reçoit toujours lui-même dans
  `element` et l'autre dans `target`. Changement de contrat, à écrire.
- **Déprécier `element`/`target`** au profit de `source`/`target`, et retirer les
  clés historiques après une transition.

## Contexte / liens

- Origine : rubrique `Suite` du ticket `2026-08-02_19-30`, candidat trié le
  2026-08-02.
- `src/engine/scene/CollisionSystem.js` — `_reconcile()`, les deux branches.
- `meta/documentation/engine.md` §9 — l'avertissement à retirer une fois réglé.
- À traiter **avec** ou **avant** la collision par paires (étape 4).

## Definition of Done

- [ ] Les deux phases suivent la **même convention**, prouvée par un test qui
      couvre début **et** fin, des deux côtés du contact.
- [ ] L'avertissement ⚠️ de `engine.md` §9 disparaît (ou décrit la nouvelle règle).
- [ ] La démo ne régresse pas (Deckard Cain réagit toujours au contact).
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
