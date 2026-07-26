# Container Kingdom — guide agent (Claude Code)

> Résumé des règles ; **la source de vérité est [`meta/agents/`](meta/agents/)**. Points
> d'entrée frères : [`AGENTS.md`](AGENTS.md),
> [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

Visualisation de conteneurs Docker rendue comme un **RPG**, sur un **moteur de
mini-RPG maison** (vanilla JS, ES modules). Deux couches :

- **`src/engine/`** — le moteur RPG **réutilisable** (ignore Docker).
- **`src/container-kingdom/`** — l'app, qui *utilise* le moteur.

## Commandes

```bash
npm run dev     # http://localhost:5173 (API Docker mockée, pas de daemon requis)
npm run verify  # lint + build + tests — à faire passer avant de conclure
```

Démo moteur : `http://localhost:5173/engine/demo/` (l'URL doit finir par `/`).
Debug : `?debug=1` (zones de collision/trigger, magenta au contact).

## Règles essentielles

- **Tâches** : prises dans le board `meta/workflow/000-backlog/` ; suivre le cycle
  (`meta/agents/recipes/workflow/work-a-task.md` : branche → `verify` → merge → done → **suite**).
- **Frontière** : app → moteur uniquement ; importer le moteur via `src/engine/index.js`.
- **Langue** : code et JSDoc en **anglais**, commits et échanges en **français**.
- **Jamais de travail direct sur `main`** ni de bascule de la branche du **tree
  principal** : chaque agent travaille dans **son propre worktree**, sur une branche
  `<agent>/<slug>` (voir `meta/agents/recipes/parallel-worktrees.md`). Conventional
  Commits FR ; **jamais** de mention IA ; **jamais** `git add -A` ; commiter/pusher
  **sur demande**.
- **« Terminé » = vérifié** (`npm run verify`) ; **tenir la doc à jour**.

## Détail

- Règles complètes : **[`meta/agents/`](meta/agents/)** — conventions, workflow, frontière moteur.
- Comprendre le code : **[`meta/documentation/`](meta/documentation/)**.

@meta/agents/conventions.md
@meta/agents/workflow.md
@meta/agents/engine-boundary.md
