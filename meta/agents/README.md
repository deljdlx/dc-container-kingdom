# `agents/` — directives pour agents IA

**Source de vérité** des règles de travail pour un agent (Claude Code, GitHub
Copilot, Cursor…). Les points d'entrée à la racine en donnent l'essentiel et
renvoient ici pour le détail — les garder minces, mettre le détail ici :

- [`CLAUDE.md`](../../CLAUDE.md) (Claude Code)
- [`AGENTS.md`](../../AGENTS.md) (agnostique)
- [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) (Copilot)

## Par où commencer (agent neuf)

1. **Les règles** ci-dessous (conventions, workflow, frontière moteur).
2. **Le cycle de travail** : [`recipes/workflow/work-a-task.md`](recipes/workflow/work-a-task.md)
   — comment un ticket avance sur le **board** en fichiers (`../workflow/`, voir
   [`../README.md`](../README.md)).
3. **En multi-agents** : [`recipes/parallel-worktrees.md`](recipes/parallel-worktrees.md)
   — chacun dans son worktree isolé, le tree principal (`main`) jamais touché.

## Les règles

- **[conventions.md](conventions.md)** — langue, style/design, git, commits, branches.
- **[workflow.md](workflow.md)** — « terminé = vérifié » (`npm run verify`), doc à
  jour, piège rAF.
- **[engine-boundary.md](engine-boundary.md)** — frontière app→moteur (impérative)
  et repères d'architecture du moteur.

## Les recipes (playbooks — index : [recipes/README.md](recipes/README.md))

- **[recipes/](recipes/)** — méthode **agnostique** : le **cycle de ticket**
  (work-a-task + ticket-*) et les méthodes (implémenter, refactorer, débugger,
  reviewer, vérifier, **worktrees**, auditer la cohérence, évaluer un ticket).
- **[../recipes/](../recipes/)** — recipes **projet** (spécifiques : ajouter un
  élément de carte, un behavior PNJ, vérifier au navigateur). **À ne pas confondre**
  avec les recipes agent ci-dessus.

## À ne pas confondre

- **`agents/`** = comment **travailler** ici (les règles).
- **`documentation/`** = comment le **code fonctionne** (architecture, moteur, app,
  développement). Pour comprendre le code, aller là.
