---
id: 002
title: development.md — renvoyer vers agents/ pour les conventions
type: docs
branch:
created: 2026-07-24
---

## Objectif

La section « Conventions » de `project/documentation/development.md` **duplique**
`project/agents/conventions.md`. La réduire à un **renvoi** vers la source unique, pour
éviter la dérive. Tâche doc, bas risque.

## Contexte / liens

- `project/documentation/development.md` (section Conventions)
- `project/agents/conventions.md` (source de vérité)

## Definition of Done

- [ ] La section Conventions de `development.md` pointe vers `project/agents/conventions.md`
      au lieu de répéter les règles (garder au plus 1–2 lignes de contexte).

## Vérification

- [ ] `npm run verify` vert (les liens résolvent)

## Journal

-
