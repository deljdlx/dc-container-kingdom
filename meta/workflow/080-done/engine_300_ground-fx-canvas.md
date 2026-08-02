---
id: 2026-08-02_18-56
title: Un canvas au sol, sous les entités
type: feat
branch: claude/ground-fx-canvas
created: 2026-08-02 18:56
ready: 2026-08-02 18:57
doing: 2026-08-02 18:58
verify: 2026-08-02 19:05
done: 2026-08-02 19:04 (merge f08e21d)
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

- [x] Une couche `ground` existe, enfant du board, entre l'herbe et les éléments.
- [x] `layer: 'ground' | 'above'` dans le descripteur, `above` par défaut.
- [x] **La poussière passe derrière un arbre** — vérifié à l'écran, capture au
      journal. C'est le critère qui fait foi.
- [x] Le jet de fontaine reste **au-dessus**, sans régression.
- [x] **Netteté sous zoom** : la mémoire du canvas suit `échelle × dpr`, mesuré à
      au moins deux niveaux de zoom.
- [x] Aucune écriture DOM ni redimensionnement quand la vue ne bouge pas (test ou
      mesure).
- [x] Le sort du budget partagé est tranché **et écrit**.
- [x] Culling, liage et anti-fuite fonctionnent sur les deux couches.
- [x] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — la couche sol est un emplacement libre pour tout ce qui se
  pose *sur* le terrain : ondes, décalques, traces de pas persistantes, et surtout
  les **ombres**, aujourd'hui des `div` par élément (`map-element__shadow`) qui
  pourraient s'y regrouper. Côté Container Kingdom, une nappe de chaleur au sol
  sous les conteneurs chargés devient une ligne de descripteur.
- **Ce qu'on laisse de côté** :
  - **deux couches, pas N** : une particule ne peut toujours pas s'intercaler
    entre *deux éléments précis* — il faudrait un canvas par profondeur, ce qui
    reste hors de question ;
  - la surface au sol **écrit dans le DOM quand la vue bouge** (position et
    taille). C'est le prix d'être dans le board ; l'écriture est conditionnée au
    changement, mais en défilement continu elle a lieu à chaque frame ;
  - **la marge de culling reste calibrée pour la goutte de fontaine** (128 px) —
    inchangé par ce ticket, et toujours à revoir le jour où un effet plus rapide
    apparaît.
- **Ce que la mesure a corrigé** — j'avais spécifié que la mémoire du canvas
  devait suivre `échelle × dpr`. Elle est **indépendante du zoom** : la taille CSS
  suit l'inverse de l'échelle, donc la densité reste constante (1,5 device pixel
  par pixel écran mesuré aux échelles 0,5, 1 et 2). La spec était fausse, le code
  est juste, et c'est la doc qui fait foi désormais.
- **Déposé en `100-follow-up/`** — rien.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-02 18:58] **Un seul système, deux surfaces** : chaque particule porte
  le nom de sa couche, chaque canvas ne peint que les siennes. Le budget reste un
  plafond global, comme tranché en *specify*.
- [2026-08-02 18:59] **Le piège du système partagé** : vieillir le système depuis
  chaque surface aurait divisé par deux toutes les durées de vie. Le `Viewport`
  l'âge **une fois par frame** et les surfaces ne font plus que dessiner. Le test
  correspondant a été réécrit pour porter ce contrat.
- [2026-08-02 18:59] `GROUND_FX_DEPTH = DEPTH_BASE − 1`, exporté à côté de
  `FX_DEPTH` avec son raisonnement : le créneau entre l'herbe (`auto`) et les
  éléments existe **dans** le board, pas à côté.
- [2026-08-02 18:59] `placeInWorld` pose la surface au sol en coordonnées monde et
  n'écrit **que si le placement change** — un redimensionnement efface le canvas,
  il ne doit pas arriver à chaque frame de pinch.
- [2026-08-02 19:00] Bug attrapé en relisant : l'ordre du spread écrasait le
  descripteur porteur de la couche quand une déclaration apportait le sien. Le
  `descriptor` est désormais appliqué **après** `...options`.

### Vérification

- [2026-08-02 19:00] `npm run verify` vert : **51 fichiers, 418 tests**.
- [2026-08-02 19:02] **Structure mesurée dans le navigateur** : la surface au sol
  est bien **enfant du board**, à z **999 999**, sous un arbre à **1 000 214**, et
  la surface du dessus à **10 000 000**.
- [2026-08-02 19:03] **Critère qui fait foi** : une même tache émise au centre
  d'un arbre est **masquée par l'arbre** sur la couche sol (seul son halo
  déborde), et **peinte par-dessus tout** sur la couche du dessus. Capture au
  dossier.
- [2026-08-02 19:04] **Netteté sous zoom** — et une hypothèse du ticket corrigée :
  je pensais que la mémoire devait suivre `échelle × dpr`. Elle est en fait
  **indépendante du zoom** (1350×840 constant), la taille CSS suivant l'inverse de
  l'échelle. Mesuré : **1,500 device pixel par pixel écran aux échelles 0,5, 1 et
  2** — densité constante, donc aucun flou.
- [2026-08-02 19:04] Poussière (15, couche sol) et gouttes (96, couche du dessus)
  coexistent : le routage par descripteur fonctionne, le culling et les ceintures
  anti-fuite restent en place.
- [2026-08-02 19:05] Sonde retirée (0 résidu).

### Validation

- [2026-08-02 19:04] Review : frontière moteur tenue, `GROUND_FX_DEPTH` exporté
  avec son raisonnement, le contrat « un seul vieillissement par frame » porté par
  un test, et le routage par couche vérifié dans le navigateur.
- [2026-08-02 19:04] Merge `--no-ff` sur `main` depuis le tree principal :
  **f08e21d** — `merge: un canvas au sol, sous les entités`
  (11 fichiers, +246 / −36).
