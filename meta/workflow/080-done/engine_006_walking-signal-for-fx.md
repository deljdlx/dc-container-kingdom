---
id: 2026-08-05_14-43
title: La poussière de pas ne se réutilise pas — il manque le signal « je marche »
type: feat
branch: claude/walking-signal-for-fx
created: 2026-08-05 14:43
ready: 2026-08-05 14:44
doing: 2026-08-05 14:45
verify: 2026-08-05 14:59
done: 2026-08-05 15:02 (merge 97b6f94)
---

## Objectif

Question posée à l'usage le 2026-08-05 : « la poussière qui suit le personnage
est-elle réutilisable, par exemple pour des PNJ ? » **L'effet oui, son
déclencheur non.**

`FootstepDust` n'a rien de spécifique au joueur : il suit n'importe quel élément
répondant à `offsetX()`/`offsetY()`, son descripteur et sa cadence sont
surchargeables, et c'est un behavior comme les autres. Ce qui bloque tient en une
option :

```js
isMoving: () => viewport.getInput().isMoving()   // ← lit le CLAVIER
```

Ce prédicat n'existe que pour le joueur. Pour un PNJ il faudrait « ce personnage
marche-t-il en ce moment », et **le moteur ne l'expose pas** :
`Character.update(walkedDistance)` reçoit la distance à chaque frame et la passe
à l'animateur **sans la retenir**. Il n'y a pas d'`isWalking()`.

(`Element.isMoving()` existe mais appartient à la machinerie de déplacement vers
cible qui est morte — `2026-07-26_14-25`.)

### Et le chemin déclaratif est fermé lui aussi

`FxBinder` sait lier un effet déclaré sur une classe (`static descriptor.fx`,
comme la fontaine), mais il **spread** les options de la déclaration : un
`isMoving` déclaré serait une fonction **statique**, sans accès à l'élément suivi.
Une porte qui dépend de l'élément est donc inexprimable aujourd'hui.

## Spécifications

_Amorce — à confirmer en « specify »._

1. **`Character.isWalking()`** — le signal traverse déjà `update(walkedDistance)`
   sans être retenu ; le mémoriser suffit. Il doit retomber à faux dès qu'une
   frame passe sans distance parcourue.
2. **`FootstepDust` lit l'élément suivi par défaut** : sans `isMoving` explicite,
   demander à ce qu'il suit s'il marche. Une déclaration
   `fx: [{ emitter: FootstepDust, at: { x: 24, y: 44 } }]` sur une base de PNJ
   suffirait alors — le binder relie déjà les éléments streamés.
3. **Corriger un JSDoc devenu faux** : `Emitter.isAlive()` justifie sa logique par
   « `enableMainCharacter()` construit son personnage et **ne l'attache jamais** au
   scene-graph ». Ce n'est plus vrai depuis `2026-08-03_19-11`. Le mécanisme
   (`_everAttached`) reste utile pour les entités détachées ; sa raison écrite,
   non.

## Firewalls / risques

1. **Ne pas dépendre du joueur dans l'effet.** Le prédicat par défaut doit lire
   l'élément suivi, jamais le viewport ni l'input — sinon on remplace un couplage
   par un autre.
2. **Un élément suivi qui n'est pas un `Character`** (une entité, un décor) n'a
   pas d'`isWalking()` : le défaut doit alors rester « ne rien émettre », comme
   aujourd'hui — « plutôt muet que poussiéreux sur une statue ».
3. **La cadence de retombée** : `isWalking()` doit être faux dès la première frame
   sans mouvement, sinon la poussière traîne après l'arrêt.
4. **Le budget de particules est global** : plusieurs PNJ poussiéreux le partagent
   avec la fontaine et le joueur. Mesurer avec quelques PNJ équipés.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-05**, `080-done` compris.
- `src/engine/fx/FootstepDust.js` — `shouldEmit()` et son option.
- `src/engine/fx/Emitter.js` — `isAlive()` et son JSDoc à corriger.
- `src/engine/character/Character.js` — `update(walkedDistance)`.
- `src/engine/fx/FxBinder.js` — `_bindElement`, le spread des options.
- `src/engine/demo/demo.js` — le câblage actuel, à simplifier.

## Definition of Done

- [x] `Character.isWalking()` existe, vrai pendant la marche, **faux dès la
      première frame sans distance parcourue** — test à l'appui.
- [x] `FootstepDust` sans `isMoving` explicite lit l'élément suivi ; suivre un
      élément qui ne sait pas répondre reste **silencieux** (test).
- [x] **Le critère qui fait foi** : un PNJ de la démo lève de la poussière en
      marchant, **déclarée** et non câblée à la main — vérifié à l'écran.
- [x] Le joueur continue de lever la sienne, sans régression.
- [x] Le JSDoc d'`Emitter.isAlive()` ne s'appuie plus sur une affirmation fausse.
- [x] Budget de particules mesuré avec les PNJ équipés (rien ne doit étouffer la
      fontaine).
- [x] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — un effet peut désormais **se déclarer sur une classe** et
  dépendre de l'état de l'élément qu'il suit. C'est le patron pour la suite :
  traces de pas persistantes, éclaboussures dans l'eau, aura d'un PNJ blessé —
  aucun n'aura besoin d'un prédicat câblé par l'hôte. Et `isWalking()` est le
  premier d'une famille d'états lisibles sur un personnage, dont un système de
  dégâts aura besoin.
- **Ce qu'on laisse de côté** :
  - **`isWalking()` est large d'une frame et se fait effacer par le parcours de
    redessin** : celui-ci appelle `Character.update()` sans argument, ce qui
    remet la distance à zéro. Sans conséquence ici — l'effet mémorise — mais tout
    consommateur qui échantillonnerait *après* la frame lirait faux. À écrire, ou
    à corriger le jour où un second consommateur apparaît ;
  - **la poussière peut traîner d'une salve** : le verrou « a marché depuis la
    dernière salve » autorise une dernière bouffée jusqu'à 120 ms après l'arrêt.
    Assumé, c'est plutôt joli ;
  - **une seule déclaration testée** (`DustyWalker`) : le chemin déclaratif n'a
    pas été éprouvé sur un PNJ **streamé**, seulement sur l'area d'origine ;
  - **le prédicat explicite reste possible** et prioritaire — rien n'oblige à
    passer par `isWalking()`.
- **Déposé en `100-follow-up/`** — un candidat :
  `2026-08-05_15-02_walk-signal-wiped-by-the-redraw-pass`.

## Journal

### Travail

- [2026-08-05 14:46] **`Character.isWalking()`** : la distance parcourue traversait
  `update()` sans être retenue, elle est mémorisée. Une frame de large — faux dès
  qu'une mise à jour ne rapporte aucune distance — pour que la poussière s'arrête
  avec les pieds.
- [2026-08-05 14:47] **`FootstepDust` interroge ce qu'il suit** quand aucun
  prédicat n'est donné. Suivre quelque chose qui ne sait pas répondre reste muet :
  mieux vaut ça que de la poussière sous une statue.
- [2026-08-05 14:48] JSDoc d'`Emitter.isAlive()` corrigé : il justifiait sa
  logique par « `enableMainCharacter()` n'attache jamais son personnage », ce qui
  a cessé d'être vrai avec `2026-08-03_19-11`. La règle reste bonne, son exemple
  a changé — et je l'avais laissé mentir hier.
- [2026-08-05 14:52] **La mesure a imposé deux corrections que je n'avais pas
  prévues** :
  1. **Mémoriser au lieu d'échantillonner.** Les cadences ne coïncident pas — un
     pas de patrouille toutes les 60 ms, une salve toutes les 120 ms, et un
     `isWalking()` large d'une frame. Interroger au moment de la salve donnait
     **zéro particule en deux secondes** de patrouille. `FootstepDust` retient
     désormais « a marché depuis la dernière salve ». L'ancien prédicat s'en
     tirait parce qu'il lisait le **clavier**, vrai tant qu'une touche est tenue.
  2. **Le binder écrasait la couche de l'effet.** `layer = 'above'` par défaut
     dans la déclaration, appliqué **après** le descripteur de la classe : une
     poussière déclarée passait donc *au-dessus* du décor. Personne ne l'avait vu
     parce que le seul effet déclaré jusqu'ici (le jet de fontaine) est
     effectivement `above`. Le défaut par défaut est maintenant **la couche de
     l'effet** ; seule une déclaration explicite l'emporte.

### Vérification

- [2026-08-05 14:58] `npm run verify` **vert** : **63 fichiers, 536 tests** (+9).
- [2026-08-05 14:55] **Critère qui fait foi** : un PNJ de la démo (`DustyWalker`,
  qui **déclare** son effet au lieu de le câbler) lève **15 particules au sol** en
  150 frames de patrouille, **sans que personne touche au clavier**. Avant, aucune
  ligne du moteur ne permettait à un PNJ de savoir qu'il marchait.
- [2026-08-05 14:55] **Pas de régression du joueur** : 21 particules au sol quand
  le joueur marche en plus, et son câblage a **perdu** son prédicat
  (`isMoving: () => input.isMoving()` supprimé de la démo).
- [2026-08-05 14:55] **Le budget de particules tient** : 115 vivantes au total sur
  600, dont 100 pour les deux fontaines — rien n'étouffe rien.
- [2026-08-05 14:57] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 537 éléments, 219 conteneurs) et le catalogue (533 sprites).
- [2026-08-05 14:53] Une fausse conclusion en route : j'ai d'abord cru que
  l'émetteur ne partait pas. Instrumenté, il **émettait bien** 15 fois — mais sur
  la couche `above`, invisible à mon compteur qui ne regardait que `ground`. C'est
  ce qui a mis au jour l'écrasement de couche par le binder.
- [2026-08-05 14:57] Sonde `window.__vp` retirée (0 résidu).

### Validation

- [2026-08-05 15:02] Review : trois gestes prévus, **deux imposés par la mesure**
  (mémoriser au lieu d'échantillonner, et rendre au binder la couche de l'effet).
  Aucun des deux n'était dans la spec — et sans le PNJ de démo, aucun ne se serait
  vu, puisque les tests unitaires passaient déjà.
- [2026-08-05 15:02] Merge `--no-ff` sur `main` : **97b6f94** — `merge: la
  poussière de pas devient réutilisable` (8 fichiers, +282 / −31), suivi de
  **d71ac2d** pour un JSDoc que mon édition avait décroché de son constructeur.
