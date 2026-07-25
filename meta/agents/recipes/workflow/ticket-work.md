# Recipe — travailler un ticket (`020-ready` → `040-doing`)

1. Créer la **branche dédiée** depuis `main` (la noter dans `branch:`) ; puis, **sur
   la branche**, `git mv` le ticket vers `meta/workflow/040-doing/` et renseigner
   `doing:`. La branche portera *work* + *verify*. En **parallèle** avec d'autres
   agents, créer la branche dans un **worktree** dédié — voir
   [parallel-worktrees](../parallel-worktrees.md).
2. Implémenter — s'appuyer sur la recipe de méthode adaptée :
   [implement-a-feature](../implement-a-feature.md), [refactor-safely](../refactor-safely.md),
   ou [debug-empirically](../debug-empirically.md).
3. **Documenter chaque itération** de travail dans `## Journal > Travail`, datée
   (`- [YYYY-MM-DD HH:MM] …` : décisions, obstacles, mesures).

> Idéalement **une** tâche en `040-doing` à la fois. Une sous-tâche qui émerge →
> la déposer en `000-backlog`, ne pas dériver.
