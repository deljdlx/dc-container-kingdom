---
id: 2026-07-27_19-04
title: Aligner les règles écrites sur la pratique réelle
type: docs
branch: claude/align-rules-with-practice
created: 2026-07-27 19:04
ready: 2026-07-27 19:11
doing: 2026-07-27 19:12
verify: 2026-07-27 19:16
done: 2026-07-27 19:18 (merge 313b3b4)
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

- [x] `conventions.md` ne donne plus qu'**un** schéma de nommage de branche, et
      il correspond aux branches réellement présentes dans le dépôt — **réserve
      écrite** : 4 branches antérieures au multi-agents subsistent, toutes mergées
      (voir `## Suite`).
- [x] `git push` n'est plus auto-autorisé — un push demande une confirmation,
      conformément à la règle.
- [x] La recipe d'audit connaît `200-ideas`.
- [x] Aucune correction cosmétique ailleurs : les fichiers qui n'ont pas à
      mentionner la boîte à idées ne la mentionnent pas.
- [x] `npm run verify` vert.

## Suite

- **Ce qu'on laisse de côté** — quatre branches antérieures au multi-agents
  survivent et contredisent visuellement la convention : `docs/mock-readme`,
  `feat/engine-sprites-catalog-page`, `feat/missing-character-bases`,
  `refactor/lazy-speech-bubble`. **Toutes les quatre sont mergées dans `main`** :
  les supprimer est trivial. Ce n'est pas fait ici — effacer des branches qu'on
  n'a pas créées relève de la règle d'isolation, ça se demande.
- **Ce que ça ouvre** — `settings.json` ne vaut que pour Claude Code ; Copilot et
  Codex ignorent ces garde-fous. Les règles qui comptent vraiment gagneraient à
  être vérifiées côté board (voir `2026-07-27_19-03`) plutôt que côté permissions,
  qui n'engagent qu'un seul agent.
- **Déposé en `100-follow-up/`** — rien.

## Journal

### Travail

- [2026-07-27 19:12] Tri préalable de `100-follow-up` : un candidat déposé par
  copilot (topologie des routes) promu en `container-kingdom_500_road-topology-strategy`,
  boîte vidée avant de démarrer.
- [2026-07-27 19:13] Nommage de branche : le bullet donnait deux schémas
  contradictoires en six lignes. Retenu `<agent>/<slug>`, avec la raison écrite —
  le préfixe dit **qui détient** la branche, ce dont dépend la règle d'isolation.
  Les préfixes par type (`feat/`, `fix/`…) disparaissent : le type vit déjà dans
  le frontmatter du ticket et dans le message de commit.
- [2026-07-27 19:14] `git push` retiré de la liste `allow` de `.claude/settings.json`.
  Les `deny` sur `--force` restent : ils protègent d'un geste irréversible, pas
  d'un geste non demandé.
- [2026-07-27 19:15] Recipe d'audit : `200-ideas` ajoutée aux contrôles — et un
  second trou trouvé en chemin, plus grave. Son **périmètre** ciblait les colonnes
  par le glob `meta/workflow/0*/`, qui excluait **les deux** boîtes hors pipeline.
  L'audit ne les avait donc jamais regardées, `100-follow-up` comprise. Corrigé en
  `meta/workflow/*/`.

### Vérification

- [2026-07-27 19:15] Contrôle des liens (contrôle 1 de la recipe d'audit) : vert.
  Aucun schéma `feat/…` / `fix/…` / `docs/…` ne subsiste dans `conventions.md`.
  `jq` confirme que `Bash(git push *)` a quitté la liste `allow` et que le JSON
  reste valide.
- [2026-07-27 19:15] `npm run verify` **vert** : lint + build + **282 tests**.
  Le change est documentaire, mais il touche `.claude/settings.json` : la
  validation JSON était le vrai risque.
- [2026-07-27 19:16] Réserve assumée sur la première DoD : quatre branches
  antérieures à la convention subsistent (`docs/…`, `feat/…`, `refactor/…`).
  Vérifié qu'elles sont **toutes mergées dans `main`**, donc supprimables sans
  perte — mais supprimer des branches qu'on n'a pas créées se demande. Reporté en
  `## Suite`.

### Validation

- [2026-07-27 19:18] Review : les trois divergences sont closes, la réserve sur
  les branches héritées est écrite plutôt que dissimulée sous une case cochée.
  Mergé sur `main` en `--no-ff` : **313b3b4**.
- [2026-07-27 19:18] Le trou trouvé en chemin (le glob `0*/` du périmètre d'audit)
  valait à lui seul le ticket : la recipe censée surveiller le board ne regardait
  aucune des deux boîtes hors pipeline.
