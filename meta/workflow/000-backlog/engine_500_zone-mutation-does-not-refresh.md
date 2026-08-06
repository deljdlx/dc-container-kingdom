---
id: 2026-08-06_11-28
title: Muter une zone de collision ne rafraîchit aucune enveloppe
type: fix
branch:
created: 2026-08-06 11:28
ready:
doing:
verify:
done:
---

## Objectif

Trouvé par la **passe d'audit A** du 2026-08-06, dont le périmètre était « les
invariants que le moteur affirme et ne fait pas respecter ».

L'invariant implicite du broad phase est **enveloppe ⊇ zones ∪ enfants** : le
parcours élague sur l'enveloppe agrégée, donc tout ce qu'elle ne couvre pas
devient intangible. `2026-08-03_19-10` l'a rétabli pour le **déplacement**. Il
reste faux pour la **mutation d'une zone**.

Mesuré : un garde dont la zone de collision passe de 10 à 400 px de large
couvre désormais un détecteur posé à 400 px — et **n'est pas détecté** :

| | |
|---|---|
| zone du garde après mutation | `x0: 100 → x1: 500` |
| détecteur | `x0: 400 → x1: 410` |
| `detector.overlaps(root)` | **false** |
| après `root.recomputeCollisionAggregate()` | **false** encore |

Le recalcul de la racine ne suffit pas : c'est **l'enveloppe du garde lui-même**
qui est restée à `100 → 110`, figée à la création de la zone. Le prune la rejette
avant même de descendre.

### Impact aujourd'hui : nul. Demain : direct.

**Rien ne mute de zone dans le dépôt** — vérifié, toutes les zones sont créées une
fois et jamais retouchées. Le défaut est donc **latent**. Mais les setters
(`zone.width()`, `zone.x0()`…) sont publics, et le premier usage naturel est
exactement celui de l'étape 5 : un rayon d'explosion qui grandit, un ennemi qui
charge et allonge sa portée, une hitbox d'attaque qui s'ouvre le temps d'un coup.
Le défaut se réveillerait au pire moment — sur un système dont on douterait
d'abord de la logique, pas de la détection.

## Spécifications

_À confirmer en « specify »._

- Une zone doit **prévenir son élément** quand sa géométrie change, et l'élément
  rafraîchir son enveloppe puis celle de ses ancêtres — le chemin existe déjà
  (`recomputeCollisionAggregate`, posé par `2026-08-03_19-10`).
- Le lien zone → élément existe (`BoundingBox._element`), il suffit de s'en
  servir. Attention à ne pas notifier pendant la **construction** de la zone, où
  l'élément n'est pas encore prêt.
- **Ou** décider que les zones sont immuables après création et le faire respecter
  (setters privés, ou une méthode `resizeZone()` sur l'élément qui, elle,
  rafraîchit). C'est peut-être le contrat le plus sain.

## Firewalls / risques

1. **Le chemin chaud** : `zone.collided()` est appelé à chaque frame par la
   détection. Notifier sur *ce* setter serait absurde — seule la **géométrie**
   (x0/y0/width/height) invalide l'enveloppe.
2. **La construction** : `createCollisionZone` pose la géométrie zone par zone
   avant de rattacher ; notifier à chaque appel ferait N recalculs pour une zone.
3. **Ne pas rouvrir la question des espaces de coordonnées** de `BoundingBox`
   (`2026-08-04_08-33`) : ce ticket ne touche qu'à la propagation.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-06**, `080-done` compris.
  `2026-08-03_19-10` traite le **déplacement**, pas la mutation de zone.
- `src/engine/scene/BoundingBox.js` — les setters de géométrie.
- `src/engine/scene/CollisionSystem.js` — `createCollisionZone`,
  `recomputeCollisionAggregate`.
- `src/engine/scene/Element.js` — `_moved()`, le patron à suivre.

## Definition of Done

- [ ] Agrandir une zone rend son élément détectable sur toute sa nouvelle
      étendue — test échouant avant correction.
- [ ] La rétrécir resserre l'enveloppe (ou la limite est écrite).
- [ ] **Aucun recalcul sur le chemin chaud** : `collided()` ne déclenche rien
      (mesure du nombre de recalculs par frame, avant/après).
- [ ] Créer une zone ne provoque **pas** N recalculs (mesure).
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
