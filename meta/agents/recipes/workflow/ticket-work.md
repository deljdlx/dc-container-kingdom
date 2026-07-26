# Recipe — travailler un ticket (`020-ready` → `040-doing`)

1. Créer la **branche dédiée** depuis `main` (la noter dans `branch:`) ; puis, **sur
   la branche**, `git mv` le ticket vers `meta/workflow/040-doing/` et renseigner
   `doing:`. La branche portera *work* + *verify*. En **multi-agents**, faire ce
   travail dans **son propre worktree** (branche `<agent>/<slug>`, sans toucher la
   branche du tree principal) — voir [parallel-worktrees](../parallel-worktrees.md).
2. Implémenter — s'appuyer sur la recipe de méthode adaptée :
   [implement-a-feature](../implement-a-feature.md), [refactor-safely](../refactor-safely.md),
   ou [debug-empirically](../debug-empirically.md).
3. **Documenter chaque itération** de travail dans `## Journal > Travail`, datée
   (`- [YYYY-MM-DD HH:MM] …` : décisions, obstacles, mesures).

> Idéalement **une** tâche en `040-doing` à la fois. Une piste qui émerge → la
> **déposer** ([ticket-follow-up](ticket-follow-up.md) : rubrique `## Suite`, ou
> candidat en `100-follow-up/` si elle demande une décision), **ne pas dériver**.
> Ce qui relève de la `DoD` du ticket courant, en revanche, reste dans le ticket —
> un follow-up n'est pas une façon de clore à moitié.
