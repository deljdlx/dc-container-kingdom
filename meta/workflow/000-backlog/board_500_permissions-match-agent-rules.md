---
id: 2026-07-29_08-52
title: Aligner les permissions Claude Code sur les règles qu'elles sont censées tenir
type: chore
branch:
created: 2026-07-29 08:52
ready:
doing:
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

- [ ] Depuis le tree principal, un `git checkout <branche>` / `git switch <branche>`
      est refusé ; la preuve (commande + refus observé) est au journal.
- [ ] Depuis un worktree d'agent, le cycle complet d'un ticket reste jouable sans
      friction nouvelle — vérifié en rejouant les blocs `bash` de
      `parallel-worktrees.md`.
- [ ] Les formes inoffensives (`git checkout --detach`, `git checkout -- <fichier>`)
      passent toujours.
- [ ] `git push` n'est plus auto-autorisé, ou son maintien est justifié par écrit.
- [ ] Le sort de `git commit *` est tranché **et écrit** (bookkeeping de board vs
      « sur demande »), sans contradiction entre `settings.json` et `conventions.md`.
- [ ] `meta/agents/tools/README.md` décrit le nouveau hook comme il décrit l'actuel.
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
