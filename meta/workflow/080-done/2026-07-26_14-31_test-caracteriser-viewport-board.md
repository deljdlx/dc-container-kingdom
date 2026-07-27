---
id: 2026-07-26_14-31
title: Caractériser Viewport et Board (boucle, streaming d'aires)
type: test
branch: codex/test-caracteriser-viewport-board
created: 2026-07-26 14:31
ready:
doing: 2026-07-27 16:35
verify: 2026-07-27 16:40
done: 2026-07-27 16:51
---

## Objectif

`Viewport.js` (474 lignes) et `Board.js` (182 lignes) sont les deux pièces
**centrales** du moteur — boucle de jeu, `dt`, déplacement du joueur, streaming
7×7, libération des aires — et les seules de cette taille à n'avoir **aucun test**
dédié (`test/` couvre `Element`, `Character`, `Camera`, `Geometry`,
`BoundingBox`, les behaviors, mais ni `Viewport` ni `Board` ni `SceneGraph`).

Objectif : **figer le comportement actuel** avant les corrections prévues sur le
streaming et le déplacement, dans la lignée des tickets de caractérisation déjà
faits (`Geometry`, `BoundingBox`).

## Spécifications

### Fonctionnel

Caractériser, sans changer le code de production :

- **Boucle** : `update(timestamp)` piloté à la main (pas de rAF — cf. le piège
  documenté), calcul du `dt`, clamp à 100 ms, première frame à `dt = 0`.
- **Déplacement** : conversion direction → (dx, dy), revert sur collision,
  réconciliation des triggers à la position **finale** (bloqué vs non bloqué).
- **Streaming** : `getCurrentAreaCoordinates()` (y compris le décalage `+ 48` et
  les coordonnées négatives), `_streamAreas()` qui ne travaille qu'au franchissement
  d'aire, fenêtre de chargement 7×7 et hystérésis de libération 9×9.
- **Board** : `loadArea` / `getAreaAt` / `freeArea` / `areaExistsAt`,
  `initialize()` (7×7) et `clear()`.
- **SceneGraph** : `addChild` / `removeChild` / `getAllChildren` / offsets
  `relativeTo` — socle de l'arbre, non couvert directement.

**Le trou est plus large que ces trois fichiers.** Mesure du 2026-07-27 (diff
sources / tests, commande de la recipe `audit-codebase`) : `Application`, `Area`,
`AreaRenderer` et `CharacterRenderer` n'ont eux non plus **aucun** test. Ce ticket
garde son périmètre — les trois pièces ci-dessus, les plus centrales — mais celui
qui le prend **décide en *specify*** s'il élargit ou s'il ouvre un second ticket
ciblé pour le reste. Ne pas laisser ce constat se reperdre.

### Technique

- Environnement de test : `vitest` en `environment: 'node'` aujourd'hui ; le
  moteur touche le DOM → utiliser `jsdom` (déjà en dépendance) pour ces fichiers,
  ou un double minimal. Choix à arbitrer en *specify*, en s'alignant sur ce que
  font déjà `test/Renderer.test.js` et `test/Element.test.js`.
- **Tests de caractérisation** : ils décrivent le comportement *actuel*, y compris
  ce qui est discutable — les écarts identifiés doivent être **notés** (et
  renvoyés vers les tickets de correction) plutôt que « corrigés au passage ».

## Contexte / liens

- `src/engine/map/Viewport.js`, `src/engine/map/Board.js`,
  `src/engine/map/SceneGraph.js`
- `meta/recipes/verify-in-browser.md` (piège rAF, pilotage manuel de `update`)
- Précédents : `meta/workflow/080-done/2026-07-25_15-19_test-geometry-characterization.md`,
  `…_test-boundingbox-characterization.md`
- **Ordre conseillé** : avant (ou avec) les tickets
  « fuite des aires » et « mouvement sous-pixel » — ces tests en sont le filet.

## Definition of Done

- [x] `test/Viewport.test.js`, `test/Board.test.js`, `test/SceneGraph.test.js`
      couvrent les points listés.
- [x] Aucun changement de comportement du code de production dans ce ticket.
- [x] Les écarts constatés sont consignés (dans le ticket, et rattachés aux tickets
      de correction existants).
- [x] `npm run verify` vert.

## Suite

- Ouvre : la JSDoc de `Viewport.enableMainCharacter()` promet un centrage par
  défaut que le comportement actuel n'honore pas ; l'écart reste suivi par
  `2026-07-27_10-34_fix-enable-main-character-defaults.md`.
- Laisse de côté : les autres pièces centrales du moteur encore sans tests
  dédiés (`Application`, `Area`, `AreaRenderer`, `CharacterRenderer`) restent
  hors périmètre de ce ticket.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 16:35] Ticket pris dans le worktree dédié `/tmp/dc-container-kingdom-codex`, branche `codex/test-caracteriser-viewport-board`, et déplacé en `040-doing`.
- [2026-07-27 16:36] Périmètre gardé tel quel en cours de route : `Viewport`, `Board`, `SceneGraph` seulement. Le constat plus large sur `Application` / `Area` / `AreaRenderer` / `CharacterRenderer` reste hors de ce ticket.
- [2026-07-27 16:38] Relecture des tests existants : `test/Board.streaming-areas.test.js` couvre déjà une partie du cycle des aires (`freeArea`, `clear`, bornage du streaming), donc les nouveaux fichiers ciblent surtout les trous listés dans la DoD plutôt que de déplacer ou réécrire l'existant.
- [2026-07-27 16:40] Écart constaté pendant la préparation : `Viewport.enableMainCharacter()` sans arguments ne centre pas le joueur malgré sa JSDoc. Comme ce ticket ne doit pas changer le code de production, l'écart est renvoyé vers `2026-07-27_10-34_fix-enable-main-character-defaults.md` au lieu d'être corrigé ici.

### Vérification

- [2026-07-27 16:40] Passage ciblé vert : `npm test -- test/Viewport.test.js test/Board.test.js test/SceneGraph.test.js` → **20 tests** sur les trois nouvelles suites.
- [2026-07-27 16:40] Les nouveaux tests couvrent les trous listés par la DoD sans modifier le code de production : boucle et clamp de `dt`, orchestration déplacement/collision/trigger, coordonnées d'aire et fenêtres 7x7 / 9x9, `Board.initialize/load/get/free`, et offsets `SceneGraph`.
- [2026-07-27 16:40] `npm run verify` vert sur la branche de travail : `lint` + `build` + **252 tests** (38 fichiers). Les traces `stderr` de `DockerApiClient.test.js` et `ContainerRepository.test.js` restent celles déjà attendues par leurs assertions d'erreur.

### Validation

- [2026-07-27 16:51] Review : DoD cochée, aucun changement de code de production dans ce ticket, et l'écart sur `enableMainCharacter()` reste bien renvoyé vers `2026-07-27_10-34_fix-enable-main-character-defaults.md` au lieu d'être corrigé au passage.
- [2026-07-27 16:51] Merge `--no-ff` de `codex/test-caracteriser-viewport-board` sur `main` : `f33caeb`.
