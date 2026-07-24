# Recipe — traiter une tâche (cycle du board)

Le déroulé de bout en bout d'une tâche via le board `project/` (voir
[`../../project/README.md`](../../project/README.md)).

## Étapes

1. **Prendre** la tâche prioritaire (en haut de `project/000-todo/`).
   `git mv` le fichier vers `project/010-doing/`. Créer la **branche dédiée** et
   la noter dans le frontmatter (`branch:`).
2. **Faire** — s'appuyer sur la recipe adaptée :
   [implement-a-feature](implement-a-feature.md), [refactor-safely](refactor-safely.md),
   ou [debug-empirically](debug-empirically.md). Tenir le **Journal** de la tâche
   au fil de l'eau (décisions, obstacles, mesures).
3. **Vérifier** ([verify-a-change](verify-a-change.md)) : `npm run verify` vert,
   validation runtime si pertinent, doc à jour. `git mv` vers `project/020-verify/`.
4. **Valider** ([review-changes](review-changes.md)) : conformité + qualité.
5. **Clore** : merger la branche sur `main` (`--no-ff`), `git mv` vers
   `project/030-done/`, cocher la Definition of Done et noter le commit / merge.

## Règles

- **Une** tâche en `010-doing/` à la fois, idéalement.
- Une **branche par tâche** ; commiter / merger **sur demande** (voir
  [../conventions.md](../conventions.md)).
- Si la tâche fait émerger d'autres tâches → les déposer en `000-todo/`, ne pas
  dériver.
