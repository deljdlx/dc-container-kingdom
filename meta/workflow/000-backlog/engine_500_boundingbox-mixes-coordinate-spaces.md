---
id: 2026-08-04_08-33
title: BoundingBox mélange deux espaces de coordonnées
type: fix
branch:
created: 2026-08-04 08:33
ready:
doing:
verify:
done:
---

## Objectif

Mis au jour en corrigeant `2026-08-03_19-10` : la même classe `BoundingBox` sert
deux conventions incompatibles, et `offsets()` n'en projette correctement qu'une.

| usage | ce que valent `x0/y0` | `offsets()` est-il juste ? |
|---|---|---|
| une **zone** (collision, trigger) | relatif à **l'élément** | oui — `x0 + element.offsetX()` |
| la **boîte de rendu agrégée** | relatif au **parent** | **non — la position de l'élément est comptée deux fois** |

D'où ça vient : `new BoundingBox(element)` amorce
`_x0 = element.x()` — la position de l'élément **dans son parent**. Or
`updateBoundingBox()` y fusionne ensuite des enfants exprimés eux aussi dans
l'espace du parent… tandis que `offsetX0()` rajoute `element.offsetX()`, qui
contient déjà `element.x()`.

**Mesuré le 2026-08-04** sur une area de 100 px de large posée en x = 100,
portant un mur de 20 px en (10, 10) : sa boîte de rendu ressort à **10 → 200**
(largeur **190**) au lieu de 0 → 100, et le board qui la fusionne annonce
**x1 = 290** au lieu de 200.

**Pourquoi personne ne l'avait vu** : `recomputeAggregates()` ne tournait qu'au
détachement d'un enfant, donc presque toujours sur le **board**, qui est en
(0, 0) — où le double comptage vaut zéro. Le défaut n'apparaît que sur un élément
dont la position locale n'est pas nulle.

## Spécifications

_À confirmer en « specify »._

- **Amorcer la boîte de rendu en `0 → width` / `0 → height`**, pas
  `x → x + width` : elle décrit l'étendue de l'élément **dans son propre
  espace**, comme les zones. `offsets()` redevient juste pour les deux usages.
- Vérifier les autres appelants de `new BoundingBox(element)` avec amorçage —
  `initBoundingBox()` en particulier — et les tests de caractérisation
  (`BoundingBox.test.js`, `BoundingBoxReceiver.test.js`,
  `CollisionAggregates.test.js`) qui figent peut-être la convention actuelle.
- Décider si `_boundingBox` (rendu) et `_collisionBoundingBox` (collision) doivent
  vraiment partager une classe : ils ne partagent ni convention ni consommateur.

## Firewalls / risques

1. **Le test `Board.streaming-areas` attend aujourd'hui `x1 = 2 × width`** sur le
   board, valeur juste parce que le board est en (0, 0). Corriger l'amorçage ne
   doit pas la changer — si elle change, c'est qu'on a déplacé le défaut.
2. **La boîte de rendu sert le debug** (`renderBoundingBox`) : vérifier à l'écran
   sous `?debug=1` que les boîtes se dessinent au bon endroit **avant** et
   **après**, sur un élément à position non nulle.
3. **Ne pas toucher à l'enveloppe de collision** : elle est amorcée *vide*
   (`seedFromElement = false`) et n'a pas le défaut. C'est elle que le broad
   phase lit ; la régresser casserait `2026-08-03_19-10`.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-04**, `080-done` compris.
- `src/engine/scene/BoundingBox.js` — le constructeur et `offsets()`.
- `src/engine/scene/CollisionSystem.js` — `recomputeAggregates()`,
  `updateBoundingBox()`, et `recomputeCollisionAggregate()` (la moitié saine,
  extraite par `2026-08-03_19-10`).
- Le ticket qui a révélé le défaut : `2026-08-03_19-10`.

## Definition of Done

- [ ] La boîte de rendu d'un élément à position **non nulle** décrit son étendue
      réelle — test à l'appui, échouant avant correction.
- [ ] `offsets()` est juste pour les **deux** usages (zone et agrégat), documenté.
- [ ] Les boîtes de debug se dessinent au bon endroit sous `?debug=1`, sur un
      élément décalé — vérifié à l'écran.
- [ ] Aucune régression de l'enveloppe de collision : la campagne du fuyard reste
      à **0 traversée**.
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
