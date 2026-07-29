---
id: 2026-07-29_08-53
title: Hygiène git — branches mergées qui traînent et merges au message par défaut
type: chore
branch:
created: 2026-07-29 08:53
ready:
doing:
verify:
done:
---

## Objectif

Deux règles de `meta/agents/conventions.md` décrochent à l'usage. Constaté à
l'audit du 2026-07-27 :

- **13 branches mergées dans `main` n'ont pas été supprimées** (`copilot/*`,
  `codex/*`, plus les anciennes `feat/*`, `docs/*`, `refactor/*`), alors que
  `parallel-worktrees.md` clôt explicitement le cycle par « supprimer seulement la
  branche ». `git branch --list` ne dit donc plus ce qui est en cours : la commande
  de coordination entre agents (« avant de démarrer : `git worktree list` et
  `git branch --list '<agent>/*'` ») ne discrimine plus rien.
- **2 merges sur les 12 derniers portent le message par défaut de git**
  (`96b60b4 Merge branch 'copilot/feat-ux-catalogue-navigable'` — le **plus
  récent** — et `f33caeb Merge branch 'codex/test-caracteriser-viewport-board'`),
  alors que la règle exige `merge: <description FR>` passé en `-m` et refuse
  nommément le message par défaut.

Coût du non-fait : l'historique de `main` perd sa lisibilité (un merge sur six ne
dit pas ce qu'il apporte) et l'inventaire des branches cesse d'être un état.

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Fonctionnel

Deux volets, réparation puis prévention :

1. **Nettoyer** — supprimer les branches déjà mergées dans `main`. Les branches
   montées par un worktree doivent d'abord être libérées (`git checkout --detach
   main` dans le worktree), sinon git refuse.
2. **Prévenir** — rendre les deux écarts détectables sans relecture humaine :
   - branches mergées non supprimées → contrôle du board-doctor
     (`2026-07-29_08-43`) ou script dédié ;
   - message de merge non conforme → contrôle sur les commits de merge de `main`
     (préfixe `merge: `), à jouer là où le board-doctor tourne.

### Technique

```bash
git branch --merged main | grep -v '^\*'   # l'inventaire à traiter
git worktree list                          # repérer les branches montées
```

À trancher en *specify* : jusqu'où remonte le contrôle des messages de merge (les
deux merges fautifs sont dans l'historique publié — on **ne réécrit pas** `main`,
le contrôle ne doit donc porter que sur les nouveaux merges, ou tolérer une base
de référence).

### Risques

- **Ne pas supprimer une branche non mergée** : filtrer sur `--merged main` et
  utiliser `git branch -d` (jamais `-D`), qui refuse justement ce cas.
- Une branche peut être montée par le worktree **d'un autre agent** : ne pas y
  toucher, le signaler (règle de coordination de `parallel-worktrees.md`).
- Les deux merges fautifs viennent d'agents (Copilot, Codex) : si leurs entrées
  n'énoncent pas la règle assez tôt, la corriger là aussi plutôt que d'accuser
  l'agent (`review-changes`, étape 5 : « si un écart vient d'un flou dans nos
  docs, corriger la doc »).

## Contexte / liens

- Règles : `meta/agents/conventions.md` (section Git, message de merge),
  `meta/agents/recipes/parallel-worktrees.md` (clôture, coordination).
- Outil de contrôle : ticket `2026-07-29_08-43` (board-doctor).
- Preuves : `git branch --merged main`, `git log --oneline --merges -12`.

## Definition of Done

- [ ] `git branch --merged main` ne liste plus que `main` (ou uniquement des
      branches dont la conservation est justifiée au journal).
- [ ] Aucune branche non mergée n'a été supprimée (`-d` uniquement, jamais `-D`).
- [ ] Un contrôle automatisé signale une branche mergée non supprimée.
- [ ] Un contrôle automatisé signale un commit de merge sans préfixe `merge: `,
      avec une base de référence documentée (l'historique existant n'est pas
      réécrit).
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
