---
id: 2026-07-26_14-18
title: Board.freeArea ne détache pas l'aire du scene-graph (fuite + coût croissant)
type: fix
branch:
created: 2026-07-26 14:18
ready:
doing:
verify:
done:
---

## Objectif

`Board.freeArea(x, y)` vide le rendu et supprime l'entrée de `this.areas`, mais
**ne détache jamais l'aire du scene-graph** (`Element.scene.children`). Trois
conséquences, toutes cumulatives quand on marche :

1. **Fuite mémoire** : chaque aire libérée (et tout son sous-arbre d'éléments)
   reste référencée par le board — rien n'est jamais collecté.
2. **Coût collision croissant** : `CollisionSystem._detect()` part du board et
   descend dans `getChildren()`. La bbox agrégée du board ne **rétrécit jamais**
   (`updateWithBoundingBox` ne fait que grossir), donc le broad phase du board ne
   coupe plus rien : chaque frame de déplacement paie une traversée
   proportionnelle au **nombre d'aires jamais créées**, pas au 7×7 courant.
3. **`Element.update()`** parcourt aussi `getChildren()` récursivement.

C'est le bug de performance structurel du streaming d'aires : plus la session
dure, plus le jeu rame.

## Spécifications

### Technique

- `freeArea()` doit détacher l'aire du scene-graph — `Element.destroy()` fait déjà
  `parent.removeChild(this)` + `scene.reset()` + `renderer.clear()`. Vérifier
  qu'il n'y a pas d'effet de bord indésirable (l'aire est jetée, pas réutilisée).
- Traiter la **bbox agrégée** : aujourd'hui `_collisionBoundingBox` /
  `_boundingBox` ne savent que grossir. Deux options à trancher en *specify* :
  - **recalcul** de la bbox agrégée du board depuis ses enfants après un
    `freeArea` (simple, borné par la fenêtre 9×9) ;
  - ou **cas spécial board** : ne pas agréger les aires (le board couvre déjà
    tout) — plus radical, à valider contre les tests de collision existants.
- `Board.clear()` vide le rendu des aires mais laisse `this.areas` peuplé et les
  enfants attachés : remettre `areas = {}` et détacher, cohérent avec le reste.

### Risques / vigilance

- Ne pas casser la réconciliation de collisions : une aire libérée dont un élément
  était « collided » doit sortir proprement (événements `.end`).
- `Viewport.freeAreasFromCurrentPosision()` garde une hystérésis (rayon 4 vs 3) —
  ne pas y toucher ici.

## Contexte / liens

- `src/engine/map/Board.js` (`freeArea`, `clear`, `createAreaAt`)
- `src/engine/map/CollisionSystem.js` (`_detect`, `updateCollisionBoundingBox`)
- `src/engine/map/Element.js` (`destroy`, `update`), `src/engine/map/SceneGraph.js`
- `src/engine/map/Viewport.js` (`_streamAreas`, `freeAreasFromCurrentPosision`)
- Docs à mettre à jour : `meta/documentation/engine.md` (section streaming/collisions)

## Definition of Done

- [ ] Après `freeArea(x, y)`, l'aire n'est plus dans `board.getChildren()` ni dans
      `board.getAreas()`, et son DOM est détaché.
- [ ] La bbox agrégée du board ne croît plus indéfiniment (comportement documenté
      et couvert par un test).
- [ ] Test : simuler une marche sur plusieurs aires (piloter `viewport.update(t)`
      à la main) et vérifier que le nombre d'enfants du board reste borné.
- [ ] `Board.clear()` remet le board dans un état réellement vide.
- [ ] Doc moteur à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
