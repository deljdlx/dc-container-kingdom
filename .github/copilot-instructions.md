# Instructions Copilot — Container Kingdom

> Résumé des règles ; **la source de vérité est [`../meta/agents/`](../meta/agents/)**.
> Points d'entrée frères : [`../CLAUDE.md`](../CLAUDE.md), [`../AGENTS.md`](../AGENTS.md).

## ⛔ AVANT DE TOUCHER AU MOINDRE FICHIER — worktree obligatoire

**Tu ne travailles JAMAIS dans ce dossier** (le working tree principal de
l'utilisateur, sur `main`). Aucune édition, aucun `git checkout` de branche ici.
Toute la tâche se fait dans **ton propre worktree** :

1. Entre dans ton worktree **`/tmp/dc-container-kingdom-copilot`** (chemin absolu,
   hors repo — le créer s'il manque) :
   ```bash
   git worktree add /tmp/dc-container-kingdom-copilot main   # une seule fois
   cd /tmp/dc-container-kingdom-copilot
   ```
2. Repars propre, sur **ta** branche :
   ```bash
   git clean -fd && git checkout main && git checkout -b copilot/<slug>
   ```
3. **Tu ne peux pas** (worktree indisponible, HEAD du principal ≠ `main`, doute
   quelconque) → **ARRÊTE-TOI et demande**. N'écris rien dans le dossier principal.

Détail : [`../meta/agents/recipes/parallel-worktrees.md`](../meta/agents/recipes/parallel-worktrees.md).

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

- **Tâches** : prises dans le board `meta/workflow/000-backlog/` ; suivre le cycle
  (`meta/agents/recipes/workflow/work-a-task.md` : branche → `verify` → merge → done).
- **Frontière** : app → moteur uniquement ; importer le moteur via `src/engine/index.js`.
- **Langue** : code et JSDoc en **anglais**, commits et échanges en **français**.
- **Jamais de travail direct sur `main`** ni de bascule de la branche du **tree
  principal** : chaque agent travaille dans **son propre worktree**, sur une branche
  `<agent>/<slug>` (voir `meta/agents/recipes/parallel-worktrees.md`). Conventional
  Commits FR ; **jamais** de mention IA ; **jamais** `git add -A` ; commiter/pusher
  **sur demande**.
- **« Terminé » = vérifié** (`npm run verify`) ; **tenir la doc à jour**.

## Détail (source de vérité)

Lire le dossier **[`../meta/agents/`](../meta/agents/)** pour les règles complètes :

- [`../meta/agents/conventions.md`](../meta/agents/conventions.md) — langue, style/design, git.
- [`../meta/agents/workflow.md`](../meta/agents/workflow.md) — vérification, doc à jour, piège rAF.
- [`../meta/agents/engine-boundary.md`](../meta/agents/engine-boundary.md) — frontière + archi.

Pour comprendre le **code** : **[`../meta/documentation/`](../meta/documentation/)**.
