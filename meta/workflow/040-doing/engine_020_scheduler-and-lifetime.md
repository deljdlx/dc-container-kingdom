---
id: 2026-08-08_17-56
title: Programmer dans le temps — délais, cadences, interpolations, durées de vie
type: feat
branch: claude/scheduler
created: 2026-08-08 17:56
ready: 2026-08-10 15:40
doing: 2026-08-10 15:45
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

### Où il vit, et qui le ticke

`Scheduler`, dans `src/engine/time/` à côté de l'horloge, **possédé et tické par
le `Viewport`** : programmer n'a de sens que là où il y a une boucle. Il rejoint
le registre `_behaviors` existant plutôt que d'ouvrir une seconde liste —
un ordonnanceur *est* un behavior. `Application.getScheduler()` délègue au
viewport, pour que l'hôte n'ait pas à savoir lequel des deux le porte.

Il lit le `dt` que la boucle lui passe, donc **il hérite de la pause et de
l'échelle sans une ligne** : c'est toute la raison de ne pas s'appuyer sur
`setTimeout`, qui continuerait de courir pendant un menu.

### L'API

```js
const scheduler = app.getScheduler();

const handle = scheduler.after(300, () => explode());       // handle.cancel()
scheduler.every(1000, () => tickPoison());
scheduler.tween(200, progress => sprite.scale(1 + progress * 0.3));
scheduler.after(2000, fadeOut, { owner: bolt });            // meurt avec l'élément
board.spawn(bolt, x, y, { ttl: 2000 });                     // et meurt tout seul
```

- Tout rend un **handle** portant `cancel()`, idempotent.
- `tween(ms, fn)` appelle `fn(progress)` **chaque frame**, de 0 à 1, et garantit
  un **dernier appel exactement à 1** : un tween qui s'arrête à 0,97 laisse un
  sprite à 97 % de sa taille pour toujours. Pas de catalogue d'easings — l'hôte
  compose sa courbe sur le `progress`.
- `{ owner: element }` : le handle s'annule quand l'élément est détruit, en
  s'abonnant à `element.destroy`. C'est le patron du `FxBinder`, pas un second
  mécanisme.

### La cadence de `every`, tranchée

**Sans dérive, avec rattrapage** : `every(1000)` déclenche à 1 000, 2 000, 3 000 ms
de temps de jeu, jamais à 1 016, 2 033… Le reste est reporté, comme la banque de
sous-pixels du déplacement et comme la cadence des emitters — c'est l'idiome déjà
en place.

Le rattrapage est **borné par le plafond de `dt`** (100 ms) : au pire, un
`every(10)` se déclenche dix fois dans la frame qui suit un retour d'onglet. C'est
le même compromis que les behaviors, et il vaut mieux que l'alternative (sauter
des tics, donc perdre des faits de jeu).

### La durée de vie

`Board.spawn(element, x, y, { ttl })` programme le `despawn`. Le moteur ne *cull*
toujours pas de lui-même — c'est l'appelant qui **demande** une durée de vie.

### Hors périmètre, explicitement

**Le pooling.** Recycler les entités n'est justifié que par une mesure, et cette
mesure n'existe pas. Ne pas déformer l'API pour l'anticiper.

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
