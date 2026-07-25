---
id: 002
title: development.md — renvoyer vers agents/ pour les conventions
type: docs
branch:
created: 2026-07-24
---

## Objectif

La section « Conventions » de `meta/documentation/development.md` **duplique**
`meta/agents/conventions.md`. La réduire à un **renvoi** vers la source unique, pour
éviter la dérive. Tâche doc, bas risque.

## Contexte / liens

- `meta/documentation/development.md` (section Conventions)
- `meta/agents/conventions.md` (source de vérité)

## Definition of Done

- [ ] La section Conventions de `development.md` pointe vers `meta/agents/conventions.md`
      au lieu de répéter les règles (garder au plus 1–2 lignes de contexte).

## Vérification

- [ ] `npm run verify` vert (les liens résolvent)

## Journal

-
