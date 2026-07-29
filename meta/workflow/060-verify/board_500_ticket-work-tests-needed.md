---
id: 2026-07-29_14-53
title: Recipe ticket-work — expliciter l'ajout de tests unitaires si besoin
type: docs
branch: copilot/ticket-work-tests-recipe
created: 2026-07-29 14:53
ready: 2026-07-29 14:55
doing: 2026-07-29 14:55
verify: 2026-07-29 14:56
done:
---

## Objectif

Clarifier la recipe `ticket-work.md` pour expliciter qu'un ticket doit ajouter
ou ajuster des tests unitaires quand le changement le nécessite.

## Spécifications

- Mettre à jour `meta/agents/recipes/workflow/ticket-work.md` avec une consigne
  explicite sur les tests unitaires « si besoin ».
- Rester une modification légère de rédaction, cohérente avec le ton des recipes.
- Ne pas changer le cycle workflow, uniquement préciser l'attendu qualité.

## Contexte / liens

- `meta/agents/recipes/workflow/ticket-work.md`

## Definition of Done

- [ ] La recipe mentionne explicitement l'ajout / mise à jour de tests unitaires
      quand pertinent pour le ticket.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 14:56] Mise à jour de [meta/agents/recipes/workflow/ticket-work.md](../../../agents/recipes/workflow/ticket-work.md) pour expliciter qu'il faut ajouter/mettre à jour les tests unitaires quand le ticket le nécessite, avec couverture adaptée au risque (nominal/limites/non-régression).

### Vérification

- [2026-07-29 14:56] `npm run verify` vert.

### Validation

- En attente de merge dans `main`.
