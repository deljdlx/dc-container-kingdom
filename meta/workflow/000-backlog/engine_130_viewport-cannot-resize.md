---
id: 2026-08-17_18-22
title: Le viewport ne sait pas se redimensionner
type: feat
branch:
created: 2026-08-17 18:22
ready:
doing:
verify:
done:
---

## Objectif

Repéré en spécifiant l'arène (`2026-08-11_08-55`), confirmé en l'écrivant.

`Viewport` prend sa taille à la construction et rien ne la reprend : pas de
`resize()`, aucune écoute de `resize` / `orientationchange`. L'arène calcule son
échelle **une fois**, au chargement, à partir de `window.innerWidth/innerHeight`.

Conséquence pour un hôte qui se dit mobile : passer le téléphone en paysage
laisse un plateau dimensionné pour le portrait, jusqu'au rechargement.

Ce que ça demanderait : redimensionner le conteneur, les surfaces FX (qui savent
déjà le faire) et re-décider l'échelle — et surtout **écrire ce que la caméra
devient** quand la fenêtre change de forme.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-11_08-55`, trié le 2026-08-17.
- `src/engine/view/Viewport.js` — la taille prise à la construction.
- `src/engine/fx/FxSurface.js` — `resize()`, qui sait déjà le faire.
- Voisin : `2026-07-26_14-24` (boucle arrêtable et teardown) — même famille,
  « le moteur sait se monter mais pas se démonter ni se remettre en forme ».

## Definition of Done

- [ ] `viewport.resize(width, height)` re-dimensionne le conteneur, les
      surfaces FX, et le dit à la caméra.
- [ ] Une rotation d'écran est absorbée **sans rechargement** — vérifié dans un
      émulateur mobile.
- [ ] Ce que devient la caméra quand la fenêtre change de forme est **écrit**.
- [ ] `npm run verify` vert.

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
