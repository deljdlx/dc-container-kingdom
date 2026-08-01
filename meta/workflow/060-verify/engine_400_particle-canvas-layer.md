---
id: 2026-08-01_21-07
title: Un layer canvas pour les particules
type: feat
branch: claude/particle-canvas-layer
created: 2026-08-01 21:07
ready: 2026-08-01 21:08
doing: 2026-08-01 21:09
verify: 2026-08-01 21:22
done:
---

## Objectif

Le moteur rend tout en **DOM** : un nœud par élément, profondeur par l'algorithme
du peintre (`z = DEPTH_BASE + offsetY + height`). C'est le bon choix pour des
sprites persistants et collidables ; c'est le mauvais pour des **centaines
d'objets éphémères**. Aucun `<canvas>` n'existe aujourd'hui dans `src/engine/`.

On veut des **particules** : étincelles, fumée, poussière, traînées. Un nœud DOM
par particule s'effondre à quelques dizaines ; un canvas en avale des centaines
sans transpirer.

**Périmètre volontairement réduit à un seul canvas, particules uniquement.**
L'éclairage (voile sombre + trous, émissif qui perce) a été envisagé puis
**écarté de ce ticket** : il veut être au-dessus de tout, il change la topologie
des surfaces, et il mérite sa propre décision une fois les particules en place.

## Spécifications

### Placement — un canvas frère du board

Le canvas est monté dans le **conteneur du viewport**, en **frère du board** et
après lui dans l'ordre DOM. Il est donc au-dessus de toute la carte, sans avoir à
concurrencer numériquement `DEPTH_BASE + offsetY`. `pointer-events: none` : il ne
capte rien.

Conséquence assumée : **une particule ne peut pas passer derrière un arbre.** Pour
des étincelles et de la fumée, c'est sans effet visible ; le jour où ça compte, ce
sera un second canvas sous les entités, pas un interleaving par élément (qui
demanderait N canvases ou une réécriture du rendu).

### Coordonnées — monde à l'écriture, écran au dessin

Le canvas a la **taille du viewport**, pas celle du monde chargé (7×7 aires
seraient hostiles à la mémoire sur mobile). Les émetteurs raisonnent en
**coordonnées monde**, comme le reste du moteur ; le layer applique l'offset
caméra au dessin :

```js
context.setTransform(scale, 0, 0, scale, -camera.x() * scale, -camera.y() * scale);
```

`scale` vient de `devicePixelRatio`, **plafonné à 2** : au-delà, on paie des pixels
que personne ne distingue. Le dépôt ne l'utilise nulle part aujourd'hui — c'est
donc une décision neuve, à documenter.

### Place dans la boucle

La game loop finit par `camera.update()` puis `renderer.update()`. Le dessin doit
venir **après**, sinon il peint avec la caméra de la frame précédente. Le layer
est donc composé par `Viewport` (comme `DirectionalInput`) et appelé en fin de
`update()` :

- `update(dt)` — intégration pure : âge, position, vitesse, mort des particules ;
- `render(camera)` — le seul endroit qui touche un contexte 2d.

Cette séparation est ce qui rend la simulation testable sans DOM.

### Contrainte dure — pas de contexte sous jsdom

Vérifié le 2026-08-01 : sous jsdom, `canvas.getContext('2d')` rend **`null`** (le
paquet natif `canvas` n'est pas installé, et le projet tient à ses dépendances
légères). Donc :

- **un contexte absent ne doit rien casser** : le layer se met en sommeil, la
  simulation continue, aucune exception ;
- les tests de dessin **injectent un faux contexte** (un enregistreur d'appels)
  plutôt que d'ajouter une dépendance native.

### Performance — la discipline déjà en vigueur

Le moteur n'écrit que si quelque chose a changé (la transformation caméra n'est pas
réécrite quand elle n'a pas bougé, le streaming ne fait rien tant qu'on reste dans
l'aire). Même exigence ici :

- **zéro particule vivante → aucun `clearRect`, aucun dessin.** La frame ne coûte
  rien ;
- la particule est **pré-rendue une fois** dans un canvas hors écran, puis
  `drawImage` — pas d'`arc()` + `fill()` par particule et par frame ;
- **budget de particules explicite** avec une politique de dépassement écrite (les
  plus vieilles meurent en premier), jamais une croissance non bornée ;
- le canvas n'est redimensionné qu'au **resize** du viewport, pas par frame.

### API publique

Sur le modèle de `enableMainCharacter()` :

```js
const fx = viewport.enableParticles();          // crée et monte le layer
fx.emit({ x, y, count: 12, /* vitesse, durée, couleur… */ });
```

Toute classe publique s'exporte depuis `src/engine/index.js` (frontière moteur).

### Risques / questions ouvertes

- **Le budget et la forme du descripteur d'émission** sont à doser : un descripteur
  trop riche fige l'API avant d'avoir un seul usage réel. Commencer étroit.
- `globalCompositeOperation` (additif) a historiquement des falaises de perf sur
  WebKit mobile. Ce ticket peut s'en passer ; si l'additif est ajouté, le mesurer.
- La démo (`src/engine/demo/`) doit prouver l'usage — c'est elle qui atteste que le
  moteur reste utilisable sans Container Kingdom.

## Contexte / liens

- `src/engine/map/Viewport.js` (boucle, composition des sous-systèmes),
  `src/engine/map/Renderer/ViewportRenderer.js` (montage, translation caméra),
  `src/engine/map/Camera.js`, `src/engine/index.js` (baril).
- Patron à suivre pour un sous-système pur et testable : `DirectionalInput`
  (`2026-07-26_14-22`).
- Doc à mettre à jour : `meta/documentation/engine.md` (§3 boucle, §5 rendu).
- Piège de vérification : `meta/recipes/verify-in-browser.md` (rAF en pause hors
  premier plan).

## Definition of Done

- [x] Un canvas monté en frère du board, au-dessus, `pointer-events: none`.
- [x] Les émetteurs s'expriment en coordonnées **monde** ; le dessin applique la
      caméra et un `devicePixelRatio` plafonné à 2.
- [x] `getContext('2d')` à `null` ne casse rien — prouvé par un test.
- [x] Simulation **testée sans jsdom** (naissance, âge, mort, intégration par `dt`,
      budget dépassé) ; dessin testé avec un contexte injecté.
- [x] Zéro particule vivante ⇒ aucun appel de dessin — prouvé par le contexte
      injecté.
- [x] `ParticleLayer` (ou son nom retenu) exporté par `src/engine/index.js`.
- [x] La démo montre l'effet, et reste pilotable au clavier comme au D-pad.
- [ ] Validation navigateur en pilotage manuel de la boucle, **plus une mesure sur
      un vrai mobile** (le produit est mobile-first) — chiffres au journal.
- [x] `meta/documentation/engine.md` à jour.
- [x] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-08-01 21:11] `ParticleSystem` (pur) + `ParticleLayer` (le seul à toucher
  un contexte 2d), exportés par le baril. La séparation est ce qui rend la
  simulation testable **sans jsdom** — 11 tests en environnement node.
- [2026-08-01 21:12] `viewport.enableParticles()` monte le canvas ; la boucle
  appelle `update(dt)` puis `render(camera)` **après** `renderer.update()`, sinon
  le dessin utiliserait la caméra de la frame précédente.
- [2026-08-01 21:12] RNG injectable dans `ParticleSystem`, budget avec éviction
  des plus vieilles, `devicePixelRatio` plafonné à 2, sprite pré-rendu par
  couleur. Contexte `null` toléré (jsdom en rend un).
- [2026-08-01 21:14] Démo : jet de la fontaine et poussière sous les pieds, les
  deux émis par des **behaviors** — donc sur l'horloge unique, sans timer maison.
- [2026-08-01 21:20] **Le canvas était invisible : correctif `FX_DEPTH`.** La
  spec affirmait qu'un frère du board n'a « pas de z-index à négocier ». C'est
  faux : le board est un `Element`, donc le `Renderer` lui pose sa profondeur
  calculée — mesurée à **1 000 560** — et il peignait par-dessus un canvas laissé
  à `z-index: auto`. La surface est élevée à `FX_DEPTH` (10 000 000), constante
  exportée à côté de `DEPTH_BASE` avec son invariant. Les deux commentaires qui
  affirmaient le contraire ont été corrigés.
- [2026-08-01 21:21] Doc : `documentation/engine.md` gagne un §3.2 et l'API
  publique est complétée.

### Vérification

- [2026-08-01 21:22] `npm run verify` vert : 47 fichiers, **363 tests** (339
  avant, +24).
- [2026-08-01 21:19] **Validation navigateur**, boucle pilotée à la main (rAF est
  en pause hors premier plan). Sonde `window.__vp` posée puis **retirée** (0
  résidu, vérifié au grep) :
  - le canvas est bien un frère du board, **après** lui, `pointer-events: none` ;
  - `devicePixelRatio` 1,5 → surface 1350×840 pour 900×560 en CSS ;
  - géométrie vérifiée contre le DOM : un élément à `left: 120` apparaît en page
    à 473 = 100 + (120 − (−253)), et une particule à (224, 438) tombe en (577,
    427) — pile sur la fontaine ;
  - **coût par frame** : 0,057 ms avec la cinquantaine de la fontaine, **0,42 ms
    à 600 particules** (le budget), soit 2,5 % d'un budget 60 fps sur ce poste.
- [2026-08-01 21:17] **Deux diagnostics faux corrigés par la mesure.** (1) « 40
  particules ne peignent que 52 pixels » : elles étaient émises au même point avec
  `speed: 0`, donc superposées — l'empreinte d'une seule. Une particule isolée
  couvre bien 52 px pour 7,5² attendus. (2) L'invisibilité n'était pas un défaut
  de dessin : le canvas contenait 2 053 pixels non transparents, dont la boîte
  englobante tombait au bon endroit. C'est la pile CSS qui était en cause.
- [2026-08-01 21:22] Régression verrouillée : trois tests jsdom sur le montage du
  layer, dont l'assertion `z-index === FX_DEPTH > DEPTH_BASE` — le bug n'était
  visible d'aucun test avant.

### Validation

-
