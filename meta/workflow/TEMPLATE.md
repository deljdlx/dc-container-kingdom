---
id: YYYY-MM-DD_HH-MM
title: Titre court de la tâche
type: feat            # feat | fix | refactor | docs | test | chore
branch:               # rempli à l'étape « work » (passage en 040-doing)
created: YYYY-MM-DD HH:MM
ready:                # daté au passage en 020-ready
doing:                # daté au passage en 040-doing
verify:               # daté au passage en 060-verify
done:                 # daté au passage en 080-done
---

## Objectif

Ce qu'on veut obtenir, et **pourquoi**.

## Spécifications

_Rempli en « specify » (voir la recipe). Selon la tâche : fonctionnel (quoi) ·
technique (comment) · schéma mermaid · risques. Doser — la DoD reste le contrat._

## Contexte / liens

- fichiers concernés, docs (`../documentation/…`), recipes utiles, tickets…

## Definition of Done

- [ ] critère concret et vérifiable 1
- [ ] critère concret et vérifiable 2

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, voir la recipe
[ticket-follow-up](../agents/recipes/workflow/ticket-follow-up.md)) : ce que le ticket
**ouvre**, ce qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. Quelques lignes ; `aucune` est une réponse valable. À la
différence du `Journal`, qui date le passé, cette rubrique regarde l'avant._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
