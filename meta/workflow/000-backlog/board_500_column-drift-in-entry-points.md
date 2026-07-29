---
id: 2026-07-29_08-50
title: Résorber le drift de colonnes — 020-ready et 200-ideas absents des règles
type: docs
branch:
created: 2026-07-29 08:50
ready:
doing:
verify:
done:
---

## Objectif

Les colonnes du board ont évolué ; les règles ne l'ont pas suivi. Constaté à
l'audit du 2026-07-27 :

- **`020-ready` n'est cité que dans `meta/README.md`.** Les trois points d'entrée
  disent tous « **Tâches : prises dans le board `meta/workflow/000-backlog/`** »
  (`CLAUDE.md:25`, `AGENTS.md:25`, `.github/copilot-instructions.md:51`) et
  `meta/agents/workflow.md:6` décrit la séquence `000-backlog → 040-doing →
  060-verify → 080-done`, sans l'étape *specify*.
- **`200-ideas` (ajouté le 2026-07-27, `678be80`) n'existe pas** dans la recipe
  d'audit : ni dans le grep du contrôle dur, ni dans le contrôle de cohérence 5.

Conséquence concrète, pas théorique : un agent neuf lit `CLAUDE.md`, prend une
tâche dans `000-backlog` et **saute *specify*** — il ne regarde même pas
`020-ready`, où l'attend le cas échéant un ticket déjà spécifié (c'était le cas le
2026-07-27, avec `2026-07-27_17-37`). Le contrôle 5 de
`audit-workflow-consistency` exige précisément cette cohérence ; il n'a pas été
rejoué après l'ajout de la colonne.

Résidu de la même famille : `meta/agents/recipes/workflow/ticket-work.md:6`
présente encore le worktree et la branche `<agent>/<slug>` comme le cas
« multi-agents », alors que `conventions.md` les rend inconditionnels.

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Fonctionnel

Après ce ticket, **la séquence de colonnes et la source des tâches sont énoncées
à l'identique partout** : `000-backlog` → `020-ready` → `040-doing` → `060-verify`
→ `080-done`, `100-follow-up` et `200-ideas` hors pipeline.

### Technique — fichiers à reprendre

| Fichier | Écart |
|---|---|
| `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` | source des tâches : `000-backlog` seul cité ; l'étape *specify* et `020-ready` sont invisibles |
| `meta/agents/workflow.md` | séquence de colonnes incomplète (pas de `020-ready`) |
| `meta/agents/recipes/audit-workflow-consistency.md` | `200-ideas` absent du grep de contrôle **et** du contrôle de cohérence 5 |
| `meta/agents/recipes/workflow/ticket-work.md` | worktree/`<agent>/<slug>` présentés comme conditionnels au multi-agents |

Trancher au passage **où se prend la tâche suivante** : `020-ready` en priorité,
`000-backlog` sinon (avec passage par *specify*) — et l'écrire une fois, au même
endroit, pour que les entrées puissent s'y référer.

### Risques

- Les trois points d'entrée sont recopiés à ~90 % : la correction doit être
  appliquée **aux trois**, ce qui est exactement le mode de défaillance qui a
  produit ce drift. Voir le ticket de génération des entrées (`2026-07-29_08-51`)
  qui supprime la cause.
- Garder les entrées **minces** : elles résument, `meta/agents/` reste la source
  de vérité.

## Contexte / liens

- Board et colonnes : `meta/README.md`.
- Cycle : `meta/agents/recipes/workflow/work-a-task.md`.
- Procédure de contrôle : `meta/agents/recipes/audit-workflow-consistency.md`.

## Definition of Done

- [ ] Les 5 fichiers du tableau énoncent la même séquence de colonnes et la même
      source de tâches.
- [ ] `200-ideas` figure dans le grep de contrôle **et** dans le contrôle 5 de
      `audit-workflow-consistency`.
- [ ] `ticket-work.md` ne présente plus le worktree comme conditionnel.
- [ ] Contrôles 1, 2, 3, 5 et 7 de `audit-workflow-consistency` rejoués et verts
      (résultats notés au journal).
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

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
