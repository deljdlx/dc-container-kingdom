---
id: 2026-07-29_08-43
title: Un seul board-doctor — consolider le garde-fou et le rendre déterministe
type: feat
branch: claude/board-doctor-consolidation
created: 2026-07-29 08:43
ready: 2026-07-29 18:14
doing: 2026-07-29 18:41
verify: 2026-07-29 18:56
done:
---

## Objectif

**Ce ticket est né en doublon.** Il a été créé le 2026-07-29 à partir de l'audit
du 2026-07-27, sans relire `080-done` — or le garde-fou existait déjà :
`2026-07-27_19-03` l'a livré le 2026-07-27 à 19h34 (merge `97bb5e1`) sous la forme
d'un **test vitest**, `test/board.test.js`, joué par `npm run verify`. La recipe
`audit-codebase` prescrit pourtant de lire `000-backlog` **et** `080-done` avant
de déposer, « sans quoi l'audit re-propose ce qui est déjà ticketé, ou pire, déjà
corrigé ». C'est exactement ce qui s'est produit.

Un second contrôleur a donc été écrit sur `copilot/board-doctor-checks`
(`meta/agents/tools/check-workflow-consistency.mjs`, 8 contrôles). Comparaison
faite contrôle par contrôle, il **n'apporte qu'une chose** que `test/board.test.js`
n'a pas : la **monotonie de la timeline** (`created ≤ ready ≤ doing ≤ verify ≤
done`). Tout le reste — liens, colonnes, `@imports`, id uniques, frontmatter,
rubrique `Suite`, nommage `projet_priorité_titre` — y est déjà, mieux cadré (le
grandfathering des tickets antérieurs à chaque règle y est explicite et commenté).

Ce ticket devient donc une **consolidation** : un seul garde-fou, celui qui tourne
déjà dans `verify`, complété du contrôle manquant. Deux outils pour le même
invariant, c'est la duplication d'autorité que la recipe `audit-codebase` liste
comme famille de défauts.

Deux défauts à corriger au passage, tous deux constatés :

- **Le garde-fou rend `main` rouge.** `test/board.test.js` (« ne garde pas de
  branches mergées hors worktrees actifs ») lit
  `git branch --merged main --format='%(refname:short)'`, dont la sortie inclut
  `(HEAD detached at refs/heads/main)` quand un worktree est en HEAD détaché. Or
  c'est **l'état de repos prescrit** par `parallel-worktrees` (« le worktree repart
  détaché sur `main` »). Conséquence : `npm run verify` passe depuis le tree
  principal et **échoue depuis un worktree au repos** — le résultat dépend de
  l'endroit d'où on le lance.
- **Une timeline déjà fausse sur `main`** : `board_500_git-hygiene-merges-and-branches`
  porte `verify: 15:26` alors que `done: 15:25`. La preuve est dans l'historique —
  la transition *verify* a été committée en `a7ad9b4` à **15:25** : l'estampille
  postdate son propre commit. C'est `verify` qui est faux, pas `done`.

## Spécifications

### Un seul garde-fou : `test/board.test.js`

Il est déjà dans `npm run verify` (donc dans « terminé = vérifié »), écrit dans le
langage du dépôt, sans dépendance ni seconde chaîne d'outils. Le script `.mjs`
n'est pas repris : il serait un contrôle de plus à maintenir pour les mêmes règles.

### Ce qu'il faut ajouter — la monotonie

`created ≤ ready ≤ doing ≤ verify ≤ done`, sur les estampilles **renseignées**
(une case vide n'est pas une violation, c'est une étape non franchie — déjà
couverte par le contrôle « date les transitions déjà franchies, et seulement
celles-là »). Comme les autres contrôles portant sur l'archive, il ne doit
regarder `080-done` qu'**à partir du pivot** déjà en place : réécrire l'archive
pour satisfaire un contrôle, ce serait la falsifier.

### Ce qu'il faut réparer

- Le faux positif : ignorer les entrées qui ne sont pas des noms de branche (git
  préfixe le HEAD détaché d'un worktree par `(`).
- `verify: 2026-07-29 15:26` → `15:25` dans
  `board_500_git-hygiene-merges-and-branches`, valeur **lue dans l'historique**
  (`a7ad9b4`), pas inventée.

### Risques

- Le contrôle de monotonie doit être ajouté **avec** la réparation de la timeline
  fautive, sinon `verify` reste rouge à la livraison.
- Comparer des estampilles `YYYY-MM-DD HH:MM` en chaînes est correct **parce que
  le format est fixe et zero-padded** ; le noter, pour que personne n'y voie une
  négligence.

## Contexte / liens

- Le garde-fou : `test/board.test.js` (ticket d'origine `2026-07-27_19-03`).
- Le doublon à abandonner : branche `copilot/board-doctor-checks` (commits
  `1044ac0`, `a5c3a7c`), qui ferme aussi ce ticket-ci sur elle-même **sans merge**.
- Règles : `meta/agents/recipes/workflow/work-a-task.md` (timeline monotone),
  `meta/agents/recipes/parallel-worktrees.md` (état de repos détaché).

## Definition of Done

- [x] `test/board.test.js` vérifie la monotonie des estampilles renseignées.
- [x] La timeline fautive de `board_500_git-hygiene-merges-and-branches` est
      corrigée à partir de l'historique, et le nouveau contrôle passe.
- [ ] Le test d'hygiène git ne prend plus un HEAD détaché pour une branche :
      `npm run verify` est **vert depuis le tree principal comme depuis un worktree
      au repos** (les deux exécutions notées au journal).
- [ ] Aucun second contrôleur n'est introduit ; la branche `copilot/board-doctor-checks`
      est abandonnée, son worktree laissé propre et détaché sur `main`.
- [x] `meta/agents/recipes/audit-workflow-consistency.md` renvoie au garde-fou
      unique, sans mentionner d'outil qui n'existe pas.
- [x] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 18:45] Comparaison contrôle par contrôle des deux garde-fous : le
  script de `copilot/board-doctor-checks` n'apporte que la **monotonie de la
  timeline** ; nommage, id uniques, frontmatter, `Suite`, liens, colonnes et
  `@imports` sont déjà dans `test/board.test.js`. Décision : ne rien reprendre
  d'autre, ne pas introduire de second outil.
- [2026-07-29 18:47] Ajout du contrôle « garde une timeline monotone » dans
  `test/board.test.js` (`created ≤ ready ≤ doing ≤ verify ≤ done`, sur les
  estampilles renseignées seulement). Helper `timestamp()` pour ne comparer que
  l'horodatage : `done` porte son hash de merge à la suite. Pivot d'archive repris
  de `SUITE_PIVOT` — au-delà, la vérité des estampilles n'est plus récupérable
  dans l'historique, et réécrire l'archive pour verdir un test la falsifierait.
- [2026-07-29 18:48] Correction du faux positif d'hygiène git : les entrées
  commençant par `(` sont ignorées. Sonde dans un worktree détaché : git y écrit
  `(no branch)` ou `(HEAD detached at refs/heads/main)` selon le cas — filtrer le
  préfixe couvre les deux, là où une comparaison exacte n'en couvrirait qu'un.
- [2026-07-29 18:50] Réparation de la timeline fautive de
  `board_500_git-hygiene-merges-and-branches` : `verify` passe de 15:26 à **15:25**,
  valeur lue dans l'historique (la transition *verify* est committée en `a7ad9b4`
  à 15:25 — l'estampille postdatait son propre commit). Le `done` était juste.
- [2026-07-29 18:54] `audit-workflow-consistency` mise à jour : la note annonçant
  une migration vers `meta/agents/tools/` promettait un outil qui ne doit pas
  exister ; elle dit maintenant que le garde-fou est unique et où ajouter un
  contrôle. La liste des contrôles automatisés y est complétée.

### Vérification

- [2026-07-29 18:56] `npm run verify` vert sur la branche : 45 fichiers,
  **335 tests** (334 avant — +1, le contrôle de monotonie).
- [2026-07-29 18:43] **Les deux contrôles ont été vus échouer** avant d'être
  déclarés bons : anomalie de timeline réintroduite → `× board — frontmatter >
  garde une timeline monotone` (1 failed / 22) ; réparée → 22 passed.
- [2026-07-29 18:44] Faux positif reproduit dans son contexte : depuis un worktree
  détaché créé pour l'occasion, `git branch --merged main --format='%(refname:short)'`
  rend `(no branch)` en plus des branches ; après filtre, il ne reste que les vraies
  branches. Worktree de sonde supprimé.

### Validation

-
