---
id: 2026-07-24_21-53
title: development.md — renvoyer vers agents/ pour les conventions
type: docs
branch:
created: 2026-07-24 21:53
ready: 2026-07-27 10:41
doing:
verify:
done:
---

## Objectif

La section « Conventions » de `meta/documentation/development.md` **duplique**
`meta/agents/conventions.md`. La réduire à un **renvoi** vers la source unique, pour
éviter la dérive. Tâche doc, bas risque.

## Spécifications

### Fonctionnel

- La section `## Conventions` de `development.md` ne **répète** plus aucune règle :
  elle renvoie vers les sources de vérité et garde au plus une ou deux lignes de
  contexte.
- Aucune information n'est perdue : vérifié ligne à ligne avant suppression.

### Technique

- Les six puces actuelles se répartissent en réalité sur **deux** sources, pas une :
  langue, commits, git, design → `meta/agents/conventions.md` ; « workflow typique »
  et « terminé = vérifié » → `meta/agents/workflow.md`. Le renvoi doit donc citer
  les deux, sinon on remplace une duplication par un pointeur incomplet.
- `development.md` s'adresse à quelqu'un qui code : garder le renvoi **utile** —
  dire *ce qu'on y trouve*, pas seulement *où c'est*.
- Contrôle de non-perte : pour chaque puce retirée, vérifier que la règle existe
  bien dans la source citée (`grep`), et le tracer dans le journal.

## Contexte / liens

- `meta/documentation/development.md` (section Conventions)
- `meta/agents/conventions.md` (source de vérité)

## Definition of Done

- [ ] La section Conventions de `development.md` pointe vers `meta/agents/conventions.md`
      au lieu de répéter les règles (garder au plus 1–2 lignes de contexte).
- [ ] Le renvoi cite **les deux** sources (`conventions.md` **et** `workflow.md`),
      puisque la section actuelle mélange les deux.
- [ ] Non-perte vérifiée puce par puce et tracée dans le journal.
- [ ] `npm run verify` vert (les liens résolvent).

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`) : ce que le ticket **ouvre**, ce
qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. `aucune` est une réponse valable._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
