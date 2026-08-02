---
id: 2026-08-02_18-56
title: Un canvas au sol, sous les entités
type: feat
branch:
created: 2026-08-02 18:56
ready: 2026-08-02 18:57
doing:
verify:
done:
---

## Objectif

La poussière sous les pas du personnage passe **au-dessus de tout** : des arbres,
des maisons, du personnage lui-même. C'est un effet **de sol**, il devrait être
masqué par ce qui se trouve devant. Signalé à l'usage le 2026-08-02.

La limite était connue et assumée — `2026-08-01_21-07` l'écrit noir sur blanc :
« une particule ne peut pas passer derrière un arbre ; le jour où ça compte, ce
sera un second canvas *sous* les entités ». Ce jour est arrivé.

**Ce n'est pas « ajouter un canvas ».** Mesuré le 2026-08-02 :

| Nœud | z-index |
|---|---|
| le **board** | **1 000 560** — il crée donc un **contexte d'empilement** |
| l'herbe (`.map-area`), dedans | `auto` (≈ 0) |
| les éléments, dedans | ≈ 1 000 000 et au-delà |
| le canvas FX actuel, **frère** du board | 10 000 000 |

Un frère du board est soit entièrement au-dessus, soit entièrement en dessous —
et en dessous, il est sous l'herbe, donc invisible. **S'intercaler exige d'être
enfant du board**, dans le créneau libre entre l'herbe et les éléments.

## Spécifications

_Amorce — à confirmer en « specify »._

### Deux surfaces, un choix par effet

- **`above`** — l'actuelle : frère du board, espace écran, `FX_DEPTH`. Le jet de
  fontaine y reste (l'eau monte au-dessus du bassin).
- **`ground`** — nouvelle : **enfant du board**, z entre l'herbe et les éléments
  (`DEPTH_BASE − 1`). La poussière, les ombres, les ondes y vont.

Le descripteur gagne un `layer: 'ground' | 'above'`, `above` par défaut — un effet
qui ne se prononce pas garde le comportement d'aujourd'hui.

### Le placement du canvas au sol

Étant **dans** le board, il subit sa transformation CSS (`translate` + `scale`).
Il doit donc être posé en **coordonnées monde** et suivre la vue :

- position CSS = `screenToWorld(0, 0)`, taille CSS = viewport ÷ échelle ;
- **réécrit seulement quand ça change** (même discipline que la transformation du
  board, qui n'est pas réémise à caméra immobile).

Conséquence heureuse à vérifier : `ViewportTransform.applyToContext` devrait
convenir **telle quelle** aux deux surfaces, l'origine monde du canvas au sol
étant précisément le point qui tombe à l'écran en (0, 0).

### La netteté sous zoom

Le canvas au sol est agrandi par le CSS : sa mémoire doit valoir
`viewport × échelle × devicePixelRatio`, sinon il devient flou dès qu'on zoome.
C'est le critère vérifiable de ce ticket.

## Firewalls / risques

1. **Le budget de particules est partagé.** Deux surfaces ne doivent pas devenir
   deux budgets qui s'ignorent : décider si chaque couche a le sien (et lequel) ou
   si le plafond reste global. À trancher **avant** de coder.
2. **Une écriture DOM par frame** guette : le canvas au sol se repositionne quand
   la vue bouge, ce qui est *tout le temps* si l'on n'y prend pas garde. La
   discipline « on n'écrit que si ça a changé » est obligatoire, pas optionnelle.
3. **Redimensionner un canvas efface son contenu** : changer la mémoire à chaque
   micro-variation de zoom viderait la couche à chaque frame de pinch. Ne
   redimensionner que sur un vrai changement.
4. **`DEPTH_BASE − 1` est un choix**, pas une évidence : il suppose qu'aucun
   élément ne descend sous `DEPTH_BASE`. C'est vrai aujourd'hui (la constante
   existe pour ça) ; le noter en commentaire, comme `FX_DEPTH`.
5. **La démo doit rester la preuve** : la poussière doit visiblement passer
   **derrière** un arbre ou une maison, sinon rien n'est prouvé.
6. **Ne pas régresser l'existant** : le jet de fontaine reste au-dessus, le
   culling, le liage et les deux ceintures anti-fuite continuent de fonctionner
   sur les deux couches.

## Contexte / liens

- La limite assumée à l'origine : `2026-08-01_21-07`.
- Les surfaces : `src/engine/fx/ParticleLayer.js`, `src/engine/map/Viewport.js`.
- La profondeur : `src/engine/map/Renderer/Renderer.js` (`DEPTH_BASE`, `FX_DEPTH`).
- La conversion : `src/engine/map/ViewportTransform.js` (`screenToWorld`).
- Le liage par descripteur : `src/engine/fx/FxBinder.js`.

## Definition of Done

- [ ] Une couche `ground` existe, enfant du board, entre l'herbe et les éléments.
- [ ] `layer: 'ground' | 'above'` dans le descripteur, `above` par défaut.
- [ ] **La poussière passe derrière un arbre** — vérifié à l'écran, capture au
      journal. C'est le critère qui fait foi.
- [ ] Le jet de fontaine reste **au-dessus**, sans régression.
- [ ] **Netteté sous zoom** : la mémoire du canvas suit `échelle × dpr`, mesuré à
      au moins deux niveaux de zoom.
- [ ] Aucune écriture DOM ni redimensionnement quand la vue ne bouge pas (test ou
      mesure).
- [ ] Le sort du budget partagé est tranché **et écrit**.
- [ ] Culling, liage et anti-fuite fonctionnent sur les deux couches.
- [ ] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

-

### Vérification

-

### Validation

-
