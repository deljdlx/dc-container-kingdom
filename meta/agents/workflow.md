# Workflow & vérification

## Source des tâches : le board `meta/`

Le travail se pilote depuis le **kanban en fichiers** `meta/` (colonnes
`000-backlog` → `040-doing` → `060-verify` → `080-done`). Prendre la tâche
prioritaire, la faire avancer de colonne en colonne, et suivre le cycle décrit
par la recipe **[`recipes/workflow/work-a-task.md`](recipes/workflow/work-a-task.md)** (branche
dédiée, `npm run verify`, merge, journal de tâche). Voir
[`../README.md`](../README.md).

Deux gestes encadrent ce cycle :

- **À la clôture**, répondre à « et ensuite ? » dans la rubrique `## Suite` du
  ticket — [`recipes/workflow/ticket-follow-up.md`](recipes/workflow/ticket-follow-up.md).
  `aucune` est une réponse valable ; une rubrique vide n'en est pas une.
- **Avant de prendre la tâche suivante**, trier `100-follow-up/` s'il n'est pas
  vide — [`recipes/workflow/follow-up-triage.md`](recipes/workflow/follow-up-triage.md).

## « Terminé » = vérifié

Avant d'annoncer qu'une tâche est finie, **`npm run verify`** (= `lint` + `build`
+ `test`) doit passer, et — quand c'est pertinent — une validation du rendu au
navigateur. Rapporter fidèlement : un test qui échoue se dit, une étape sautée se
dit.

La CI (`.github/workflows/quality.yml`) rejoue `npm run verify` sur chaque PR et
push sur `main`.

## Tenir la documentation à jour (impératif)

**Une doc obsolète est un bug.** Toute modification qui touche l'architecture, le
comportement, l'API publique, les commandes ou les conventions **doit** mettre à
jour la doc concernée **dans le même changement** :

- `documentation/` (architecture, engine, container-kingdom, development) — y
  compris les schémas Mermaid ;
- les README (racine et `src/engine/`) et les **JSDoc** de l'API touchée ;
- si les **règles agent** changent : ce dossier `agents/` **et** les trois points
  d'entrée qui le résument (`CLAUDE.md`, `AGENTS.md`,
  `.github/copilot-instructions.md`).

## Piège de vérification au navigateur (rAF)

La game loop tourne sur `requestAnimationFrame` : **rAF est en pause quand
l'onglet est en arrière-plan** → joueur et PNJ gèlent, et une sonde qui `await`
un rAF **timeout**. Pour vérifier de façon déterministe, **piloter la boucle à la
main** en appelant `viewport.update(timestamp)` avec des timestamps croissants :

```js
const vp = window.__vp; // hook temporaire, à retirer avant de committer
let t = performance.now();
vp.move('down');                       // ou vp.press('down'); vp.press('right'); en diagonale
for (let i = 0; i < 40; i++) { t += 16; vp.update(t); } // ~40 frames à 16 ms
```

C'est le **même chemin** que celui appelé par rAF (voir
`documentation/development.md`).
