# Recipe — travail multi-agents en worktrees git

Plusieurs agents (Claude, Copilot, Codex…) sur le même repo = collisions si le
**working tree, l'index et le HEAD sont partagés**. Modèle : **chaque agent travaille
dans son propre worktree isolé** ; le working tree **principal** de l'utilisateur
reste sur `main` et **personne n'en change la branche active**.

## Règles dures

1. **Ne jamais changer la branche active du working tree principal.** Interdit d'y
   faire `git checkout <autre-branche>` pour travailler. Il reste sur `main`.
2. **Tout travail de branche se fait dans le worktree de l'agent**, jamais dans le
   principal — même solo (le principal peut être lu par un autre agent à tout moment).
3. **Branches nommées par agent** : `<agent>/<slug>` (`claude/…`, `copilot/…`,
   `codex/…`). Un agent ne touche, n'édite ni ne merge **que ses propres** branches.
4. **Commits / merges sur `main` : sur demande** — le *bookkeeping de board*
   (création de ticket, transitions de colonnes) reste l'exception au fil de l'eau.

## Worktree de l'agent (fixe, réutilisé)

**Un worktree fixe par agent, sous `/tmp`** — chemin **absolu** (aucune ambiguïté
`../` / symlink ; hors repo → jamais scanné par vite / vitest / eslint), **pas un
nouveau par ticket** :

```
<repo>/                  # principal, sur `main` (ne pas toucher sa branche)
/tmp/<repo>-<agent>/     # le worktree de l'agent : claude, copilot, …
```

Le créer une fois (`<repo>` = `dc-container-kingdom`, ex. `/tmp/dc-container-kingdom-copilot`) :

```bash
git worktree add /tmp/<repo>-<agent> main
```

> `/tmp` est **volatil** (vidé au reboot) : voulu — le worktree se recrée à la demande.
> **Ne jamais** le placer *dans* le repo : `../` résout mal via le symlink et le
> worktree finit scanné par l'outillage.

## Démarrer une tâche (dans le worktree)

Depuis **son** worktree, repartir **propre** d'un `main` à jour :

```bash
cd /tmp/<repo>-<agent>
git status                          # doit être propre ; sinon stash ou demander
git clean -fd                       # supprime les untracked d'une tâche précédente *
git checkout main && git merge --ff-only @{u} 2>/dev/null || true
git checkout -b <agent>/<slug>      # branche dédiée, nommée par agent
```

> \* `git clean -fd` est **indispensable** : un fichier untracked laissé par une
> tâche précédente (ex. un ticket déplacé de colonne) survit aux bascules de branche
> et **pollue le board** (doublons). C'est la cause de fichiers présents en double.

Puis dérouler le cycle **dans ce worktree** : transitions `040-doing` → `060-verify`,
implémentation, `npm run verify`, journal — tout sur la branche `<agent>/<slug>`.

## Clore (merge local, sans push)

1. Branche prête, `verify` **vert** dans le worktree.
2. **Merge `--no-ff` dans `main`.** `main` n'est monté que dans le principal : le
   merge s'y fait, et `main` **reste** `main` (on n'y change pas de branche) —
   c'est le **point de coordination** entre agents (premier arrivé, premier servi,
   court). Si `main` a avancé, rebaser `<agent>/<slug>` dessus avant de re-merger.
3. Clôturer le ticket sur `main` (transition `080-done` + hash) — bookkeeping.
4. **Ne pas supprimer le worktree** (il est fixe, réutilisé) : supprimer seulement la
   branche (`git branch -d <agent>/<slug>`). Le worktree est renettoyé au démarrage
   suivant (`git clean -fd`).

## Coordination

- **Un agent par ticket.** Avant de démarrer : `git worktree list` et
  `git branch --list '<agent>/*'`.
- Un agent **ne touche jamais** la branche/le worktree d'un autre agent ; s'il repère
  un souci dans leur travail, il le **signale** à l'utilisateur.
- **Jamais** `git add -A` / `git add .` — chemins explicites (voir
  [../conventions.md](../conventions.md)).

> Modèle inspiré de règles git multi-agents éprouvées, adapté à notre flux **local**
> (board en fichiers, merge `--no-ff` local, pas de push/PR).
