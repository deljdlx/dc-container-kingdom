# Recipes — playbooks de méthode (génériques)

Des **modes d'emploi étape par étape**, **agnostiques au projet** : ils décrivent
*comment travailler*, pas *comment ajouter tel truc* (ça, ce sont les recipes
projet dans [`../../recipes/`](../../recipes/)). Réutilisables
d'un dépôt à l'autre.

## Cycle d'un ticket (board)

- **[work-a-task.md](workflow/work-a-task.md)** — l'**overview** du cycle. **Le point de départ.**
- Une recipe par étape : [ticket-create](workflow/ticket-create.md) · [ticket-specify](workflow/ticket-specify.md)
  · [ticket-work](workflow/ticket-work.md) · [ticket-verify](workflow/ticket-verify.md) ·
  [ticket-validate](workflow/ticket-validate.md).

## Méthode (mobilisées pendant work / verify / validate)

- **[implement-a-feature.md](implement-a-feature.md)** — comprendre → concevoir →
  tester → vérifier → documenter.
- **[refactor-safely.md](refactor-safely.md)** — tests de caractérisation, puis
  refactorer sous le filet.
- **[debug-empirically.md](debug-empirically.md)** — reproduire → isoler → prouver
  par la mesure → corriger → non-régression.
- **[review-changes.md](review-changes.md)** — reviewer un changement (règles + qualité).
- **[verify-a-change.md](verify-a-change.md)** — « terminé = vérifié » (auto + runtime).
- **[audit-workflow-consistency.md](audit-workflow-consistency.md)** — après une
  évolution du workflow, vérifier que les specs restent cohérentes et à jour.
- **[parallel-worktrees.md](parallel-worktrees.md)** — plusieurs agents en parallèle :
  isoler chaque ticket dans un worktree git dédié.

## Écrire une recipe

- **Courte**, **orientée étapes**, **agnostique** (pas d'API ni de nom de fichier
  du projet — ça va dans les recipes projet).
- Pointer vers les règles (`../conventions.md`, `../workflow.md`) et les autres
  recipes plutôt que dupliquer.
- La tenir à jour si le pattern change (voir [../workflow.md](../workflow.md)).
