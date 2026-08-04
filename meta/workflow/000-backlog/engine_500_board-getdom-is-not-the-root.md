---
id: 2026-08-04_17-16
title: board.getDom() ne rend pas la vraie racine du board
type: fix
branch:
created: 2026-08-04 17:16
ready:
doing:
verify:
done:
---

## Objectif

`Element` garde `this.dom` synchronisé avec son renderer via `setRenderer()`.
Le `Board`, lui, fait `this.renderer = new BoardRenderer(this)` **en assignation
directe** dans son constructeur : `this.dom` reste donc le nœud du renderer
générique créé par `super()`, tandis que la vraie racine est
`board.getRenderer().getDom()`.

Mesuré le 2026-08-04 en vérifiant un montage :
`board.getDom().contains(noeudDuJoueur)` rend **false** alors que le nœud est bel
et bien dans la racine du board.

Deux nœuds prétendent être le board, et **l'API publique rend le mauvais**.

## Spécifications

_À confirmer en « specify »._

- Passer par `setRenderer()` dans le constructeur du `Board`, ce qui resynchronise
  `dom` — en vérifiant que `registerEvents()`, rejoué, ne double pas les écouteurs
  (il attache un `click` sur `this.dom`).
- Ou, à défaut, documenter que sur le board il faut lire
  `getRenderer().getDom()` — mais c'est garder le piège.

## Firewalls / risques

1. **Le nœud orphelin** : celui du renderer générique n'est jamais monté. Vérifier
   qu'on ne laisse pas un nœud mort accroché, ni un écouteur sur lui.
2. **`Viewport.clear()` et `Board.clear()`** manipulent le DOM du board :
   s'assurer qu'ils visent le bon nœud avant et après.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-04**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-03_19-11`, trié le 2026-08-04.
- `src/engine/world/Board.js` — le constructeur.
- `src/engine/scene/Element.js` — `setRenderer()`, `getDom()`.

## Definition of Done

- [ ] `board.getDom()` **est** la racine montée dans le viewport — test à l'appui,
      échouant avant correction.
- [ ] Aucun écouteur dupliqué, aucun nœud orphelin (test ou mesure).
- [ ] Les trois hôtes sans erreur console ; `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
