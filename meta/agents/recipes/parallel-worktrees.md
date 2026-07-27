# Recipe — travail multi-agents en worktrees git

Plusieurs agents (Claude, Copilot, Codex…) sur le même repo = collisions si le
**working tree, l'index et le HEAD sont partagés**. Modèle : **chaque agent travaille
dans son propre worktree isolé** ; le working tree **principal** de l'utilisateur
reste sur `main` et **personne n'en change la branche active**.

> **Topologie du cycle** (board sur `main`, branche pour *work*/*verify*, merge
> `--no-ff` + clôture sur `main`, bookkeeping) : source de vérité dans
> [work-a-task](workflow/work-a-task.md). Ici : la **couche worktree** qui isole ce
> travail entre agents.

## Règles dures

1. **Ne jamais changer la branche active du working tree principal.** Interdit d'y
   faire `git checkout <autre-branche>` pour travailler. Il reste sur `main`.
2. **Tout travail de branche se fait dans le worktree de l'agent**, jamais dans le
   principal — même solo (le principal peut être lu par un autre agent à tout moment).
3. **Branches nommées par agent** : `<agent>/<slug>` (`claude/…`, `copilot/…`,
   `codex/…`). Un agent ne touche, n'édite ni ne merge **que ses propres** branches.
4. **Bookkeeping de board vs « sur demande »** (merges sur `main`, push) : voir les
   Règles transverses de [work-a-task](workflow/work-a-task.md).

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
git worktree add --detach /tmp/<repo>-<agent> main
```

> **`--detach` n'est pas optionnel** : `main` est déjà monté par le primaire, et git
> refuse de le monter deux fois (`fatal: 'main' is already used by worktree at …`).
> Le worktree démarre donc sur un HEAD détaché à la hauteur de `main` — c'est sans
> importance, chaque tâche crée sa branche juste après.

> `/tmp` est **volatil** (vidé au reboot) : voulu — le worktree se recrée à la demande.
> **Ne jamais** le placer *dans* le repo : `../` résout mal via le symlink et le
> worktree finit scanné par l'outillage.

## Démarrer une tâche (dans le worktree)

Depuis **son** worktree, repartir **propre** d'un `main` à jour :

```bash
cd /tmp/<repo>-<agent>
git status                          # doit être propre ; sinon stash ou demander
git clean -fd                       # supprime les untracked d'une tâche précédente *
git fetch origin 2>/dev/null || true
git checkout -b <agent>/<slug> main # branche dédiée, créée DEPUIS main **
git merge --ff-only origin/main 2>/dev/null || true   # rattrape un main local en retard
```

> \* `git clean -fd` est **indispensable** : un fichier untracked laissé par une
> tâche précédente (ex. un ticket déplacé de colonne) survit aux bascules de branche
> et **pollue le board** (doublons). C'est la cause de fichiers présents en double.

> \*\* **Ne pas** faire `git checkout main` ici : `main` appartient au primaire, la
> commande échoue (`fatal: … already used by worktree`). Enchaînée en `&&`, elle
> emporte le `checkout -b` avec elle — la branche n'est **jamais créée** et l'agent
> travaille depuis le HEAD périmé de sa tâche précédente, sans rien voir.
> `git checkout -b <agent>/<slug> main` branche **depuis** `main` sans le monter ;
> le `--ff-only` qui suit met la branche à niveau si `main` local a du retard sur
> l'amont (il s'exécute sur la branche, pas sur `main` — même effet, autorisé ici).

Puis dérouler le cycle **dans ce worktree** : transitions `040-doing` → `060-verify`,
implémentation, `npm run verify`, journal — tout sur la branche `<agent>/<slug>`.

## Clore (merge local, sans push)

Le **merge dans `main`** est la **seule** écriture autorisée sur le primaire, et il
doit le laisser **propre**. `main` n'est monté que là : le merge s'y fait sans jamais
changer sa branche (`main` reste `main`). **Ne jamais** y faire de `checkout` / `add`
/ `mv` à la main hors des étapes ci-dessous — c'est ce qui laisse un index sale.

1. Branche prête, `verify` **vert** dans le worktree.
2. **Depuis le primaire** (sur `main`), merger — un **seul** `git merge`, rien à la
   main :
   ```bash
   cd <repo>                         # le primaire, sur main
   git merge --no-ff <agent>/<slug> -m "merge: <description FR>"
   ```
   Le `-m` n'est pas cosmétique : sans lui git écrit `Merge branch '<agent>/<slug>'`,
   qui ne dit rien de ce qui a été fait. Le message de merge suit la même règle que
   les commits (voir [../conventions.md](../conventions.md)) — préfixe `merge:` et
   description **française**.
   Si `main` a avancé, rebaser `<agent>/<slug>` sur `main` **dans le worktree**, puis
   re-merger. **Point de coordination** entre agents (FIFO, court).
3. Clôturer le ticket **sur `main`, dans le primaire** : `git mv` vers `080-done`,
   `done:` + hash, puis **commit** (bookkeeping).
4. **Laisser le primaire PROPRE** : `git status` doit être vide (sur `main`, aucun
   résidu stagé) avant de rendre la main. Un index sale committé sur `main`
   corromprait le board.
5. **Ne pas supprimer le worktree** (fixe, réutilisé) : supprimer seulement la branche.
   Il faut d'abord la **libérer** — git refuse de supprimer une branche montée par un
   worktree (`error: cannot delete branch … used by worktree at …`) :
   ```bash
   cd /tmp/<repo>-<agent> && git checkout --detach main   # libère la branche
   cd <repo> && git branch -d <agent>/<slug>
   ```
   Le worktree repart ainsi détaché sur `main`, exactement dans l'état où le
   « Démarrer une tâche » ci-dessus l'attend.

## Coordination

- **Un agent par ticket.** Avant de démarrer : `git worktree list` et
  `git branch --list '<agent>/*'`.
- Un agent **ne touche jamais** la branche/le worktree d'un autre agent ; s'il repère
  un souci dans leur travail, il le **signale** à l'utilisateur.
- **Jamais** `git add -A` / `git add .` — chemins explicites (voir
  [../conventions.md](../conventions.md)).

> Modèle inspiré de règles git multi-agents éprouvées, adapté à notre flux **local**
> (board en fichiers, merge `--no-ff` local, pas de push/PR).
