---
id: 2026-08-05_14-43
title: La poussière de pas ne se réutilise pas — il manque le signal « je marche »
type: feat
branch:
created: 2026-08-05 14:43
ready:
doing:
verify:
done:
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

- [ ] `Character.isWalking()` existe, vrai pendant la marche, **faux dès la
      première frame sans distance parcourue** — test à l'appui.
- [ ] `FootstepDust` sans `isMoving` explicite lit l'élément suivi ; suivre un
      élément qui ne sait pas répondre reste **silencieux** (test).
- [ ] **Le critère qui fait foi** : un PNJ de la démo lève de la poussière en
      marchant, **déclarée** et non câblée à la main — vérifié à l'écran.
- [ ] Le joueur continue de lever la sienne, sans régression.
- [ ] Le JSDoc d'`Emitter.isAlive()` ne s'appuie plus sur une affirmation fausse.
- [ ] Budget de particules mesuré avec les PNJ équipés (rien ne doit étouffer la
      fontaine).
- [ ] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

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
