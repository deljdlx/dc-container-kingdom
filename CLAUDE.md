# Container Kingdom — guide agent (Claude Code)

> Résumé des règles ; **la source de vérité est [`agents/`](agents/)**. Points
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

- **Tâches** : prises dans le board `project/000-backlog/` ; suivre le cycle
  (`agents/recipes/work-a-task.md` : branche → `verify` → merge → done).
- **Frontière** : app → moteur uniquement ; importer le moteur via `src/engine/index.js`.
- **Langue** : code et JSDoc en **anglais**, commits et échanges en **français**.
- **Une branche par feature** ; Conventional Commits FR ; **jamais** de mention IA ;
  **jamais** `git add -A` ; commiter/pusher **sur demande**.
- **« Terminé » = vérifié** (`npm run verify`) ; **tenir la doc à jour**.

## Détail

- Règles complètes : **[`agents/`](agents/)** — conventions, workflow, frontière moteur.
- Comprendre le code : **[`documentation/`](documentation/)**.

@agents/conventions.md
@agents/workflow.md
@agents/engine-boundary.md
