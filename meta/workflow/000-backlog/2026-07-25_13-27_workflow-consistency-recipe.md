---
id: 2026-07-25_13-27
title: Recipe — auditer la cohérence des specs de workflow
type: docs
branch:
created: 2026-07-25 13:27
ready:
doing:
verify:
done:
---

## Objectif

Après toute évolution du workflow (colonnes, recipes, TEMPLATE, règles agent,
fichiers d'entrée), rien ne garantit que l'ensemble reste **cohérent et à jour** :
c'est vérifié à la main (link-check, grep de chemins stale, relecture croisée), et
des références stale ont déjà survécu — ex. cette session, `project/040-doing/`
resté sans le segment `workflow/`, invisible au link-check car en prose.

On veut une **recipe de méthode agent** décrivant une **passe d'audit
reproductible** : un agent la suit pour confirmer que recipes, board README, règles
agent, fichiers d'entrée et TEMPLATE **s'accordent** (mêmes noms de colonnes,
chemins, cycle, topologie git), que **tous les liens résolvent** et qu'**aucune
référence n'est stale**. Pourquoi : garder la doc-agent auto-cohérente sans
relecture manuelle à chaque changement.

## Spécifications

_À remplir à l'étape « specify » : périmètre exact des fichiers audités, liste des
contrôles (cohérence inter-fichiers, liens, chemins stale, TEMPLATE vs recipes,
topologie git), format de sortie du rapport._

## Contexte / liens

- Emplacement proposé : `meta/agents/recipes/` (recipe de **méthode**, à côté de
  `review-changes.md` / `verify-a-change.md`) — pas dans `recipes/workflow/` (qui
  contient les étapes du cycle).
- Artefacts à couvrir : `meta/agents/recipes/workflow/*`, `meta/workflow/TEMPLATE.md`,
  `meta/README.md`, `meta/agents/{conventions,workflow,engine-boundary}.md`,
  `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md`.
- Peut s'appuyer sur un futur script dans `meta/agents/tools/` (link-check,
  grep de chemins stale) pour automatiser les contrôles mécaniques.

## Definition of Done

- [ ] Recipe créée dans `meta/agents/recipes/`, indexée dans son `README.md`.
- [ ] Couvre au moins : cohérence inter-fichiers, résolution des liens, détection
      des références stale (y compris en prose, hors liens markdown).
- [ ] _(à affiner en « specify »)_

## Journal

### Travail

-

### Vérification

-

### Validation

-
