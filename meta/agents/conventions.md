# Conventions

## Langue

- Code, identifiants (variables/fonctions/classes), commentaires, **JSDoc** →
  **anglais**.
- **Arborescence** — **tout nom de dossier et de fichier** → **anglais**, sans
  exception : colonnes du board (`000-backlog`, `200-ideas`) comme **titres de
  tickets** (`engine_020_keyboard-input-diagonals.md`). Un nom de fichier est un
  identifiant, pas de la prose.
  - Le **contenu** du ticket, lui, reste français — `title:`, objectif,
    spécifications, journal — au même titre que les commits et les échanges.
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
- **Les merges aussi** : `merge: <description FR>`, passé explicitement en `-m`.
  Le message par défaut de git (`Merge branch '<branche>'`) ne dit rien de ce qui a
  été fait et n'est pas accepté.
- **Jamais** de mention d'assistance IA (pas de `Co-Authored-By`, pas de
  « Generated with… »).
- **Commiter / pusher uniquement sur demande.**
- **Jamais** `git add -A` / `git add .` — stager des chemins explicites.
- Les PR suivent le template (`.github/pull_request_template.md`).
