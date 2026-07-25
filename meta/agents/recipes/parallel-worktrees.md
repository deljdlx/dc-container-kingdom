# Recipe — travailler en parallèle avec des worktrees git

**Quand** : plusieurs agents (ou toi + un autre) travaillent en même temps sur le
repo. **Pourquoi** : un seul working tree partagé = index / HEAD / fichiers communs
→ collisions (commits contaminés, `checkout` bloqué, fichiers écrasés). Un
**worktree git** donne à chaque agent son **répertoire, son index et son HEAD**
propres, sur la même base d'objets et de refs.

> Solo, sans autre agent actif, un worktree est superflu : une branche dans le
> répertoire principal suffit. Les worktrees servent le **parallèle**.

## Emplacement

Les worktrees vivent dans un **dossier frère**, hors du repo, pour que
vite / vitest / eslint ne les scannent jamais (aucune config à ajouter) :

```
<repo>/                       # primaire, sur `main`
<repo>.worktrees/<slug>/      # un par ticket en cours
```

`<slug>` = la branche avec les `/` remplacés par `-` (ex. `feat/missing-bases` →
`feat-missing-bases`). Ici `<repo>` = `dc-container-kingdom`.

## Cycle de vie (greffé sur le cycle d'un ticket)

1. **Démarrer** (étape [work](workflow/ticket-work.md)) — créer branche + worktree
   depuis un `main` à jour, puis travailler **dans ce répertoire** :

   ```bash
   git worktree add ../<repo>.worktrees/<slug> -b feat/<slug>
   cd ../<repo>.worktrees/<slug>
   ```

   Les transitions `040-doing` → `060-verify` et le journal s'y font, sur la branche.

2. **Vérifier** (étape [verify](workflow/ticket-verify.md)) — `npm run verify` **dans
   le worktree**, isolé (pas de collision avec les autres agents).

3. **Clore** (étape [validate](workflow/ticket-validate.md)) — depuis le primaire
   (`main`), merger puis **retirer** le worktree :

   ```bash
   git merge --no-ff feat/<slug>
   git worktree remove ../<repo>.worktrees/<slug>
   git branch -d feat/<slug>
   ```

   Puis clôturer le ticket sur `main` (transition `080-done`, hash du merge).

## Coordination (léger)

- **Un agent par ticket / par worktree.** Avant de démarrer, vérifier qu'il n'est
  pas déjà pris : `git worktree list` et `git branch --list 'feat/*'`.
- Le **board sur `main`** reste le point de rendez-vous : garder les commits de
  bookkeeping **courts et atomiques** (`git commit -- <chemin>`) pour limiter la
  contention sur `main`.
- Jamais `git add -A` / `git add .` — stager des chemins explicites (voir
  [../conventions.md](../conventions.md)).

## Nettoyage

```bash
git worktree list              # worktrees actifs
git worktree remove <chemin>   # après merge
git worktree prune             # purger les références mortes
```

> Un worktree oublié = une branche qui traîne. Le retirer fait partie de *validate*.
