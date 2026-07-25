# `agents/` — directives pour agents IA

**Source de vérité** des règles de travail pour un agent (Claude Code, GitHub
Copilot, Cursor…). Les points d'entrée à la racine en donnent l'essentiel et
renvoient ici pour le détail — les garder minces, mettre le détail ici :

- [`CLAUDE.md`](../../CLAUDE.md) (Claude Code)
- [`AGENTS.md`](../../AGENTS.md) (agnostique)
- [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) (Copilot)

## Contenu

- **[conventions.md](conventions.md)** — langue, style/design, git, commits, branches.
- **[workflow.md](workflow.md)** — branche → vérifier → merger, `npm run verify`,
  « terminé = vérifié », doc à jour, piège rAF.
- **[engine-boundary.md](engine-boundary.md)** — frontière app→moteur (impérative)
  et repères d'architecture du moteur.
- **[recipes/](recipes/)** — playbooks étape par étape des tâches récurrentes
  (ajouter un élément, un behavior, vérifier au navigateur, feature moteur, review).

## À ne pas confondre

- **`agents/`** = comment **travailler** ici (les règles).
- **`documentation/`** = comment le **code fonctionne** (architecture, moteur, app,
  développement). Pour comprendre le code, aller là.
