---
id: 2026-08-08_17-56
title: Programmer dans le temps — délais, cadences, interpolations, durées de vie
type: feat
branch:
created: 2026-08-08 17:56
ready:
doing:
verify:
done:
---

## Objectif

Le moteur ne sait pas dire « dans 300 ms », « toutes les secondes », « de 0 à 1 en
200 ms », ni « meurs dans 2 s ». Chaque hôte doit donc écrire son propre minuteur,
à la main, avec un behavior.

Le projectile de la démo en est la preuve : **une quarantaine de lignes** pour
créer une entité, l'inscrire à la boucle, accumuler la distance, se retirer de la
boucle et se despawner — et il n'a pourtant ni durée de vie, ni cooldown, ni
animation d'impact. Multiplié par « l'explosion grandit sur 300 ms », « le poison
tique chaque seconde », « le tir se recharge en 500 ms », c'est le même minuteur
réécrit à chaque fois, chaque fois un peu différemment.

C'est le premier levier concret vers les missiles : sans lui, tout ce qui est
temporaire se câble à la main.

## Spécifications

_À confirmer en « specify »._

- **Sur l'horloge du moteur** (`2026-08-08_17-55`), jamais sur `setTimeout` : ce
  qui est programmé doit **geler avec la pause** et suivre `scale`. C'est la
  raison d'être du ticket ; un `setTimeout` continuerait de courir pendant un
  menu.
- Les primitives, à doser : `after(ms, fn)`, `every(ms, fn)`, `tween(ms, fn)`
  (progression 0→1, avec une courbe passée en paramètre plutôt qu'un catalogue
  d'easings). Chacune rend de quoi **annuler**.
- **Une durée de vie sur ce qu'on fait naître** : `spawn(entity, { ttl })`, pour
  que « ce truc existe 2 secondes » cesse d'être un compteur dans un behavior.
- **Mourir avec ce à quoi c'est accroché** : une chose programmée sur un élément
  détruit doit s'annuler seule. Le patron existe déjà — le `FxBinder` s'abonne à
  `element.destroy` — et c'est celui à suivre, pas un second mécanisme.
- **Hors périmètre, explicitement : le pooling.** Recycler les entités n'est
  justifié que par une mesure, et cette mesure n'existe pas encore. Ne pas
  l'anticiper dans l'API au point de la déformer, ne pas l'écrire.

## Firewalls / risques

1. **Ne pas ajouter un second registre parallèle à `_behaviors`.** Un
   ordonnanceur *est* un behavior, ou bien il remplace le registre — pas deux
   listes qu'on ticke chacune de son côté.
2. **L'annulation doit être sûre pendant l'émission** : annuler depuis le
   callback qu'on est en train d'exécuter ne doit pas faire sauter le suivant.
   `EventEmitter` a résolu exactement ça en copy-on-write ; s'en inspirer.
3. **La dérive** : `every(1000)` qui repart de « maintenant » à chaque tir dérive
   avec le temps. Décider — cadence rattrapée ou intervalle glissant — et l'écrire.
4. **Un `dt` de 100 ms (le plafond) ne doit pas déclencher dix fois un
   `every(10)`** d'un coup. Politique à trancher, comme pour les emitters.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-08**, `080-done` compris.
- Dépend de : `2026-08-08_17-55` (l'horloge). À ne pas démarrer avant.
- `src/engine/demo/demo.js` — le projectile câblé à la main, cas d'usage n° 1.
- `src/engine/view/Viewport.js` — `addBehavior` / `removeBehavior`, `_behaviors`.
- `src/engine/fx/Emitter.js` — la cadence déjà écrite à la main (`interval`), qui
  devrait devenir un client.
- `src/engine/fx/FxBinder.js` — le patron « mourir avec son élément ».
- `src/engine/world/Board.js` — `spawn()` / `despawn()`, où atterrit le `ttl`.

## Definition of Done

- [ ] Le projectile de la démo est **réécrit** avec les nouvelles primitives, et
      le journal cite le nombre de lignes avant / après.
- [ ] Ce qui est programmé **gèle en pause** et suit `scale` — démontré au
      navigateur.
- [ ] Une chose programmée sur un élément détruit **s'annule seule** — test.
- [ ] L'annulation depuis l'intérieur d'un callback est sûre — test.
- [ ] `Emitter` utilise l'ordonnanceur au lieu de sa propre cadence, ou le
      journal dit pourquoi non.
- [ ] API exportée depuis `src/engine/index.js`, JSDoc + `engine.md` à jour,
      `npm run verify` vert.

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
