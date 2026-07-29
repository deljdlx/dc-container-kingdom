---
id: 2026-07-29_08-52
title: Aligner les permissions Claude Code sur les règles qu'elles sont censées tenir
type: chore
branch: copilot/permissions-match-agent-rules
created: 2026-07-29 08:52
ready: 2026-07-29 15:05
doing: 2026-07-29 15:05
verify:
done:
---

## Objectif

Les règles les plus dures du dépôt sont **en prose seulement**, alors que la
couche permissions pourrait les tenir. `.claude/settings.json` auto-autorise
aujourd'hui :

```
"Bash(git push *)"   "Bash(git commit *)"   "Bash(git checkout *)"   "Bash(git merge *)"
```

— précisément les gestes que les règles encadrent :

- « commiter / pusher **uniquement sur demande** » (`meta/agents/conventions.md`) ;
- « **jamais** changer la branche active du working tree principal », règle dure n°1
  de `meta/agents/recipes/parallel-worktrees.md`.

Le `deny` montre que le levier est connu et bien utilisé (`git add -A`,
`git add .`, `git push --force`, `rm -rf /*`) : il s'arrête juste avant les cas
qui coûtent le plus cher. Un `git checkout <branche>` lancé depuis le tree
principal casse l'isolation multi-agents sans qu'aucune confirmation n'apparaisse.

Un garde-fou exécuté vaut mieux qu'un paragraphe en gras — c'est déjà la doctrine
du dépôt (`meta/agents/tools/README.md` : « un hook automatise une règle, il ne la
remplace pas »).

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Fonctionnel

Après ce ticket : depuis le **tree principal**, une commande qui changerait la
branche active est **refusée** (pas seulement déconseillée) ; un `git push` passe
par une confirmation. Depuis un **worktree d'agent**, rien ne change — le travail
de branche doit rester fluide.

### Technique — pistes à trancher

- **Hook `PreToolUse`/Bash** (le plus précis) : refuser `git checkout <branche>` /
  `git switch <branche>` quand le cwd est le tree principal, en laissant passer
  les formes inoffensives (`git checkout --detach`, `git checkout -- <fichier>`,
  `git checkout -b` depuis un worktree). Distinguer le principal d'un worktree :
  `git rev-parse --git-common-dir` vs `--git-dir` (égaux dans le principal).
  Modèle disponible : `.claude/hooks/allow-readonly-bash.sh`, dont le parti pris
  *fail-safe* (ne rien décider quand on ne peut pas prouver) doit être **inversé**
  ici — un hook de blocage doit refuser en cas de doute, pas laisser passer.
- **`deny` / retrait d'`allow`** pour `git push` : le retirer de l'`allow` suffit
  à restaurer la confirmation, ce qui est exactement ce que dit la règle « sur
  demande ». Vérifier que ça ne casse pas le flux local (le projet merge en local,
  sans push ni PR).
- **Ne pas toucher** aux `allow` du bookkeeping de board : `git mv`, `git commit`
  des transitions de colonnes sont explicitement **hors** du « sur demande »
  (règles transverses de `work-a-task`). Si `git commit *` doit rester ouvert,
  l'écrire noir sur blanc dans `meta/agents/tools/README.md` plutôt que le laisser
  en contradiction apparente avec `conventions.md`.

### Risques

- **Trop bloquer paralyse les agents en worktree** : le hook doit être testé
  depuis les deux contextes (principal *et* `/tmp/dc-container-kingdom-<agent>`)
  avant d'être livré — c'est le contrôle 4 de `audit-workflow-consistency`
  (« les commandes documentées s'exécutent, dans le contexte qu'elles décrivent »).
- Les hooks sont **spécifiques à Claude Code** : Copilot et Codex ne les voient
  pas. La règle en prose reste donc nécessaire pour eux — le hook la double, il ne
  la remplace pas.

## Contexte / liens

- `.claude/settings.json` (permissions + enregistrement des hooks).
- `.claude/hooks/allow-readonly-bash.sh` (modèle de hook, parti pris fail-safe).
- Règles concernées : `meta/agents/conventions.md` (git, « sur demande »),
  `meta/agents/recipes/parallel-worktrees.md` (règles dures 1 et 2).
- Doc à mettre à jour : `meta/agents/tools/README.md`.

## Definition of Done

- [x] Depuis le tree principal, un `git checkout <branche>` / `git switch <branche>`
      est refusé ; la preuve (commande + refus observé) est au journal.
- [x] Depuis un worktree d'agent, le cycle complet d'un ticket reste jouable sans
      friction nouvelle — vérifié en rejouant les blocs `bash` de
      `parallel-worktrees.md`.
- [x] Les formes inoffensives (`git checkout --detach`, `git checkout -- <fichier>`)
      passent toujours.
- [x] `git push` n'est plus auto-autorisé, ou son maintien est justifié par écrit.
- [x] Le sort de `git commit *` est tranché **et écrit** (bookkeeping de board vs
      « sur demande »), sans contradiction entre `settings.json` et `conventions.md`.
- [x] `meta/agents/tools/README.md` décrit le nouveau hook comme il décrit l'actuel.
- [x] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 15:10] Ajout du hook [deny-primary-branch-switch.sh](../../../.claude/hooks/deny-primary-branch-switch.sh) et enregistrement dans [.claude/settings.json](../../../.claude/settings.json) pour refuser `git checkout <branche>` / `git switch <branche>` sur le tree principal, avec exemption des formes inoffensives (`--detach`, `checkout -- <fichier>`).
- [2026-07-29 15:11] Mise à jour de [meta/agents/tools/README.md](../../../meta/agents/tools/README.md) pour documenter le hook *fail-closed* et clarifier la politique permissions (`git push` hors `allow`, `git commit` conservé pour le bookkeeping).
- [2026-07-29 15:11] Mise à jour de [meta/agents/conventions.md](../../../meta/agents/conventions.md) pour expliciter l'exception de commits locaux de bookkeeping du board, alignée avec [meta/agents/recipes/workflow/work-a-task.md](../../../meta/agents/recipes/workflow/work-a-task.md).
- [2026-07-29 15:13] Correction opportuniste de liens relatifs cassés dans [meta/workflow/080-done/board_500_column-drift-in-entry-points.md](../../080-done/board_500_column-drift-in-entry-points.md), détectés pendant `npm run verify`.

### Vérification

- [2026-07-29 15:12] Preuve hook (tree principal) : payload `git checkout feature/test` puis `git switch feature/test` → `permissionDecision":"deny"` (refus observé).
- [2026-07-29 15:12] Preuve hook (formes inoffensives) : payloads `git checkout --detach` et `git checkout -- README.md` → sortie vide, `rc=0`.
- [2026-07-29 15:12] Preuve hook (worktree agent) : payload `cd /tmp/dc-container-kingdom-copilot && git checkout test/branch` → sortie vide, `rc=0`.
- [2026-07-29 15:12] Rejeu de commandes documentées de [meta/agents/recipes/parallel-worktrees.md](../../../meta/agents/recipes/parallel-worktrees.md) (`git status`, `git fetch`, création/suppression d'une branche smoke) : exécution sans friction.
- [2026-07-29 15:12] Vérification permissions : `Bash(git push *)` absent de `.claude/settings.json`; `Bash(git commit *)` conservé.
- [2026-07-29 15:13] `npm run verify` vert (lint, build, 45 fichiers de test / 332 tests).

### Validation

-
