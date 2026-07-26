---
id: 2026-07-26_14-31
title: Caractériser Viewport et Board (boucle, streaming d'aires)
type: test
branch:
created: 2026-07-26 14:31
ready:
doing:
verify:
done:
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

- [ ] `test/Viewport.test.js`, `test/Board.test.js`, `test/SceneGraph.test.js`
      couvrent les points listés.
- [ ] Aucun changement de comportement du code de production dans ce ticket.
- [ ] Les écarts constatés sont consignés (dans le ticket, et rattachés aux tickets
      de correction existants).
- [ ] `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
