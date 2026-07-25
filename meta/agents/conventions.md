# Conventions

## Langue

- Code, identifiants (variables/fonctions/classes), commentaires, **JSDoc** →
  **anglais**.
- Commits, PR, échanges → **français**.

## Style & design

- **Épouser le style du code environnant** (nommage, densité de commentaires, idiomes).
- **SOLID / découplage** : responsabilités séparées, dépendances explicites. Le
  moteur sépare déjà ses préoccupations en sous-systèmes (`Element` compose
  `SceneGraph`, `CollisionSystem`, `Geometry`, `EventEmitter`, `Renderer`) — suivre
  ce patron plutôt que de gonfler une classe.
- **JSDoc** sur l'API publique et la logique subtile ; ailleurs, code
  auto-documenté (noms clairs) plutôt que commentaires.
- **Tests** sur la logique critique et les chemins fragiles.
- **Produit** : mobile-first, soin de la performance et de la finition visuelle.

## Git

- **Une branche par feature/fix** — jamais de travail direct sur `main`. Créer une
  branche dédiée (`feat/…`, `fix/…`, `refactor/…`, `docs/…`, `chore/…`), coder →
  vérifier → merger sur `main` (`--no-ff`). En **multi-agents**, chaque agent
  travaille dans **son propre worktree** (branche préfixée par l'agent, `claude/…` /
  `copilot/…`) et ne change **jamais** la branche du working tree principal — voir
  [recipes/parallel-worktrees.md](recipes/parallel-worktrees.md).
- **Conventional Commits** + description **française** (`feat:`, `fix:`, `refactor:`,
  `docs:`, `test:`, `chore:`).
- **Jamais** de mention d'assistance IA (pas de `Co-Authored-By`, pas de
  « Generated with… »).
- **Commiter / pusher uniquement sur demande.**
- **Jamais** `git add -A` / `git add .` — stager des chemins explicites.
- Les PR suivent le template (`.github/pull_request_template.md`).
