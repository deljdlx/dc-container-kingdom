# Recipes — playbooks de méthode (génériques)

Des **modes d'emploi étape par étape**, **agnostiques au projet** : ils décrivent
*comment travailler*, pas *comment ajouter tel truc* (ça, ce sont les recipes
projet dans [`../../project/recipes/`](../../project/recipes/)). Réutilisables
d'un dépôt à l'autre.

## Disponibles

- **[work-a-task.md](work-a-task.md)** — le cycle d'une tâche via le board
  `project/` (todo → doing → verify → done). **Le point de départ.**
- **[implement-a-feature.md](implement-a-feature.md)** — comprendre → concevoir →
  tester → vérifier → documenter.
- **[refactor-safely.md](refactor-safely.md)** — tests de caractérisation, puis
  refactorer sous le filet.
- **[debug-empirically.md](debug-empirically.md)** — reproduire → isoler → prouver
  par la mesure → corriger → non-régression.
- **[review-changes.md](review-changes.md)** — reviewer un changement (règles + qualité).
- **[verify-a-change.md](verify-a-change.md)** — « terminé = vérifié » (auto + runtime).

## Écrire une recipe

- **Courte**, **orientée étapes**, **agnostique** (pas d'API ni de nom de fichier
  du projet — ça va dans les recipes projet).
- Pointer vers les règles (`../conventions.md`, `../workflow.md`) et les autres
  recipes plutôt que dupliquer.
- La tenir à jour si le pattern change (voir [../workflow.md](../workflow.md)).
