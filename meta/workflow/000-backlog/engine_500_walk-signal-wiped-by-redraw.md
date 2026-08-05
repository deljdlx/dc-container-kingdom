---
id: 2026-08-05_15-38
title: Le parcours de redessin efface le signal de marche
type: fix
branch:
created: 2026-08-05 15:38
ready:
doing:
verify:
done:
---

## Objectif

`Character.isWalking()` s'appuie sur la distance retenue par
`update(walkedDistance)`. Or le parcours de redessin par frame appelle
`element.update()` **sans argument** sur les nœuds sales — donc
`Character.update(0)` — et remet la distance à zéro.

Mesuré le 2026-08-05 sur un PNJ en patrouille, 60 frames : **16 appels** avec une
distance de 4 px, **23 appels sans argument**, entrelacés (`null, 4, null, 4…`).
Un observateur qui lit `isWalking()` *après* la frame voit donc toujours `false`.

`FootstepDust` n'en souffre pas : il mémorise « a marché depuis la dernière
salve » et lit pendant la phase des behaviors, avant le parcours. Mais c'est un
**contournement chanceux**, pas une garantie.

## Spécifications

_À confirmer en « specify »._ Deux directions :

- **Distinguer les deux gestes** : « repeindre » et « avancer d'une distance » ne
  devraient pas être la même méthode. `Character.update()` sans argument ne
  toucherait plus l'état de marche — reste à décider **qui** le remet à faux
  quand le personnage s'arrête (aujourd'hui c'est justement cet appel).
- **Donner au signal une durée explicite** : mémoriser le *numéro de frame* du
  dernier déplacement et comparer à la frame courante, plutôt que de dépendre de
  qui appelle quoi. Demande une notion de frame que le moteur n'expose pas encore.

## Firewalls / risques

1. **Le signal doit rester court** : la poussière doit s'arrêter avec les pieds.
   Élargir la fenêtre pour régler le problème créerait une traînée.
2. **`FootstepDust` compense déjà** : après correction, vérifier qu'il ne
   sur-émet pas (mémorisation + signal plus large = deux marges cumulées).
3. **Le parcours de redessin est un chemin chaud** : ne pas y ajouter de travail.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-05**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-05_14-43`, trié le 2026-08-05.
- `src/engine/character/Character.js` — `update()`, `isWalking()`.
- `src/engine/scene/Element.js` — `update()`, qui appelle sans argument.
- `src/engine/fx/FootstepDust.js` — le contournement qui masque le défaut.

## Definition of Done

- [ ] `isWalking()` rend vrai pour un personnage qui a marché **cette frame**,
      lu **après** la frame — test à l'appui, échouant avant correction.
- [ ] Il retombe à faux dès la première frame sans déplacement.
- [ ] `FootstepDust` ne sur-émet pas après la correction (mesure).
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
