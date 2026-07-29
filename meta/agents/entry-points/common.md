## Le projet

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

- **Tâches** : prises dans `meta/workflow/020-ready/` en priorité, sinon
  `meta/workflow/000-backlog/` (avec passage par *specify*) ; suivre le cycle
  (`meta/agents/recipes/workflow/work-a-task.md` : `000-backlog` → `020-ready` →
  `040-doing` → `060-verify` → `080-done`, puis **suite**).
- **Frontière** : app → moteur uniquement ; importer le moteur via `src/engine/index.js`.
- **Langue** : code, JSDoc et **tout nom de fichier/dossier** — titres de tickets
  compris — en **anglais** ; commits, contenu des tickets et échanges en
  **français**.
- **Jamais de travail direct sur `main`** ni de bascule de la branche du **tree
  principal** : chaque agent travaille dans **son propre worktree**, sur une branche
  `<agent>/<slug>` (voir `meta/agents/recipes/parallel-worktrees.md`). Conventional
  Commits FR ; **jamais** de mention IA ; **jamais** `git add -A` ; commiter/pusher
  **sur demande**.
- **« Terminé » = vérifié** (`npm run verify`) ; **tenir la doc à jour**.

## Détail (source de vérité)

Lire le dossier **[`{{META_PREFIX}}meta/agents/`]({{META_PREFIX}}meta/agents/)** pour les règles complètes :

- [`{{META_PREFIX}}meta/agents/conventions.md`]({{META_PREFIX}}meta/agents/conventions.md) — langue, style/design, git.
- [`{{META_PREFIX}}meta/agents/workflow.md`]({{META_PREFIX}}meta/agents/workflow.md) — vérification, doc à jour, piège rAF.
- [`{{META_PREFIX}}meta/agents/engine-boundary.md`]({{META_PREFIX}}meta/agents/engine-boundary.md) — frontière + archi.

Pour comprendre le **code** : **[`{{META_PREFIX}}meta/documentation/`]({{META_PREFIX}}meta/documentation/)**.
