---
id: 2026-07-27_19-04
title: Aligner les règles écrites sur la pratique réelle
type: docs
branch:
created: 2026-07-27 19:04
ready:
doing:
verify:
done:
---

## Objectif

Trois endroits où **la règle écrite dit une chose et la pratique en fait une
autre**. Aucun n'est grave isolément ; ensemble ils apprennent à lire les
conventions comme des suggestions, ce qui est le vrai coût.

### 1. Deux schémas de nommage de branche, dans le même bullet

`meta/agents/conventions.md` prescrit une branche `feat/…`, `fix/…`,
`refactor/…`, `docs/…`, `chore/…` — **puis**, deux lignes plus bas, une branche
préfixée par l'agent (`claude/…`, `copilot/…`) en multi-agents. Les deux moitiés
de la même phrase se contredisent.

La pratique a tranché : **toutes** les branches vivantes sont en
`<agent>/<slug>`. C'est aussi la seule forme qui porte l'information utile ici —
**qui** détient la branche, ce dont dépend la règle d'isolation (« un agent ne
touche jamais la branche d'un autre »). Les préfixes par type ne survivent que
dans des branches antérieures au multi-agents.

### 2. `git push` auto-autorisé alors que la règle dit « sur demande »

`.claude/settings.json` liste `Bash(git push *)` en `allow`, quand les
conventions posent « commiter / pusher **uniquement sur demande** ». Le garde-fou
contredit la règle qu'il est censé servir.

**Portée à ne pas confondre** : `settings.json` ne vaut que pour Claude Code —
Copilot et Codex l'ignorent. C'est un garde-fou personnel, pas une convention
projet. Il n'en reste pas moins qu'un garde-fou qui autorise ce que la règle
interdit ne garde rien.

### 3. La recipe d'audit ignore `200-ideas`

`audit-workflow-consistency.md` énumère les colonnes dans ses contrôles de
cohérence, et la colonne `200-ideas` — ajoutée le 2026-07-27 — n'y figure pas.
Un contrôleur aveugle à une colonne est pire qu'une colonne non documentée : il
donne le vert sans l'avoir regardée.

## Spécifications

_Rempli en « specify »._

Point de vigilance sur le **3** : la même omission a probablement d'autres
occurrences. Sur les huit fichiers qui citent `100-follow-up` sans mentionner
`200-ideas`, la plupart n'ont **aucune raison** de la mentionner — un
`ticket-work` qui dit « dépose un candidat » n'a pas à parler de la boîte à
idées. Corriger la recipe d'audit, pas les huit : ajouter du bruit partout est
une autre façon de rendre la doc illisible.

Sur le **2**, une piste écartée d'avance pour ne pas la reproposer : interdire
« `git checkout` dans le tree principal » **n'est pas exprimable** en règle de
permission — le matcher voit la commande, pas le répertoire courant, et
`git checkout -b x` est légitime dans un worktree d'agent. Il faudrait un hook
qui inspecte le `cwd`, et il reste à vérifier que le payload `PreToolUse`
l'expose. Hors périmètre tant que ce n'est pas vérifié.

## Contexte / liens

- `meta/agents/conventions.md` (section Git, le bullet contradictoire)
- `meta/agents/recipes/parallel-worktrees.md` (règle dure n°3, `<agent>/<slug>`)
- `.claude/settings.json` (liste `allow`)
- `meta/agents/recipes/audit-workflow-consistency.md` (contrôles de cohérence)
- Ticket frère : `2026-07-27_19-03` (le garde-fou automatique, qui empêchera la
  récidive)

## Definition of Done

- [ ] `conventions.md` ne donne plus qu'**un** schéma de nommage de branche, et
      il correspond aux branches réellement présentes dans le dépôt.
- [ ] `git push` n'est plus auto-autorisé — un push demande une confirmation,
      conformément à la règle.
- [ ] La recipe d'audit connaît `200-ideas`.
- [ ] Aucune correction cosmétique ailleurs : les fichiers qui n'ont pas à
      mentionner la boîte à idées ne la mentionnent pas.
- [ ] `npm run verify` vert.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
