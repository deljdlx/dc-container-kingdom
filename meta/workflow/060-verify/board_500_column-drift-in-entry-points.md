---
id: 2026-07-29_08-50
title: Résorber le drift de colonnes — 020-ready et 200-ideas absents des règles
type: docs
branch: copilot/column-drift-entry-points
created: 2026-07-29 08:50
ready: 2026-07-29 15:00
doing: 2026-07-29 15:00
verify: 2026-07-29 15:02
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

- [x] Les 5 fichiers du tableau énoncent la même séquence de colonnes et la même
      source de tâches.
- [x] `200-ideas` figure dans le grep de contrôle **et** dans le contrôle 5 de
      `audit-workflow-consistency`.
- [x] `ticket-work.md` ne présente plus le worktree comme conditionnel.
- [x] Contrôles 1, 2, 3, 5 et 7 de `audit-workflow-consistency` rejoués et verts
      (résultats notés au journal).
- [x] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 15:01] Alignement des points d'entrée [CLAUDE.md](../../../CLAUDE.md), [AGENTS.md](../../../AGENTS.md) et [.github/copilot-instructions.md](../../../.github/copilot-instructions.md) : source de tâches clarifiée (`020-ready` prioritaire, sinon `000-backlog` avec *specify*) et séquence complète du pipeline.
- [2026-07-29 15:01] Mise à jour de [meta/agents/workflow.md](../../../agents/workflow.md), [meta/agents/recipes/audit-workflow-consistency.md](../../../agents/recipes/audit-workflow-consistency.md) (ajout de `200-ideas` au contrôle dur) et [meta/agents/recipes/workflow/ticket-work.md](../../../agents/recipes/workflow/ticket-work.md) pour rendre le worktree dédié inconditionnel.
- [2026-07-29 15:02] Correction opportuniste d'un lien cassé détecté par le contrôle 1 dans [meta/workflow/080-done/board_500_ticket-work-tests-needed.md](../../080-done/board_500_ticket-work-tests-needed.md) afin de restaurer un board vert.

### Vérification

- [2026-07-29 15:02] Contrôle 1 rejoué (script liens markdown relatifs) : `CONTROL1 links OK`.
- [2026-07-29 15:02] Contrôle 2 rejoué (grep dur `meta/<colonne>/`) : aucun résultat.
- [2026-07-29 15:02] Contrôle 3 rejoué (`@imports` de `CLAUDE.md`) : 3/3 cibles `OK`.
- [2026-07-29 15:02] Contrôles 5 et 7 rejoués (grep ciblé) : séquence `000-backlog → 020-ready → 040-doing → 060-verify → 080-done` et colonnes hors pipeline `100-follow-up` / `200-ideas` présentes dans les docs de référence.
- [2026-07-29 15:02] `npm run verify` vert (lint, build, 45 fichiers de test / 332 tests).

### Validation

-
