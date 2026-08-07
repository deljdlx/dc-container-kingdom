---
id: 2026-08-06_17-20
title: Le recalcul d'enveloppe est linéaire en enfants et domine à l'échelle
type: fix
branch: claude/aggregate-grow-and-tighten
created: 2026-08-06 17:20
ready: 2026-08-07 18:32
doing: 2026-08-07 18:33
verify:
done:
---

## Objectif

Trouvé par la **passe d'audit B** du 2026-08-06, dont le périmètre était « où le
rendu DOM plafonne ». Le plafond n'est pas là où je l'attendais, et le premier
poste de coût est **une décision que j'ai prise le 2026-08-03 sur une mesure qui
ne passait pas l'échelle**.

`Element._moved()` appelle `parent.recomputeCollisionAggregate()`, qui **parcourt
tous les enfants** du parent. Mesuré à 3 501 éléments, dont 3 221 dans une même
area, joueur en marche :

| | |
|---|---|
| temps script par frame | **12,3 ms** (budget 60 fps : 16,6) |
| dont recalcul d'enveloppe | **6,3 ms — 51 %** |
| recalculs par frame | 28,4 |
| enfants balayés par frame | **30 358** |

Pour comparaison, les deux postes que je soupçonnais : le balayage de montage
pèse **1 %** (0,17 ms) et la détection de collision **11 %** (0,71 ms).

### Ce que la mesure d'origine avait manqué

En corrigeant `2026-08-03_19-10`, j'avais comparé « faire grossir » et
« recalculer » **sur la démo nue (≈300 éléments)** : même 60 fps, et une enveloppe
qui restait à 2,31× la tuile au lieu de 3,7×. J'en avais conclu que le recalcul
gagnait *sans contrepartie*. La contrepartie existe, elle est juste invisible à
300 éléments :

- **faire grossir** est en O(1) par déplacement ;
- **recalculer** est en O(enfants du parent) par déplacement.

La justesse, elle, n'est pas en cause : l'enveloppe **doit** suivre le mouvement.
C'est le *comment* qui ne passe pas l'échelle.

## Spécifications

_À confirmer en « specify »._

- **Découpler les deux gestes** : faire grossir à chaque déplacement (O(1),
  toujours correct — une enveloppe trop large n'élague pas assez, elle ne ment
  jamais), et **recalculer épisodiquement** pour la resserrer : au streaming
  d'area, sur un budget par frame, ou quand la dérive dépasse un seuil.
- Le seuil de resserrage doit être **mesuré**, pas choisi : la dérive observée
  était de 3,7× la tuile en 25 s avec « faire grossir » seul.

## Firewalls / risques

1. **Ne pas re-casser la justesse** : la campagne du fuyard (`2026-08-03_19-10`,
   36 approches) doit rester à **0 traversée**. C'est le test qui fait foi.
2. **Le coût du resserrage se déplace, il ne disparaît pas** : un recalcul
   épisodique sur une area de 3 000 enfants reste un balayage de 3 000. Le
   répartir (budget par frame) plutôt que le concentrer.
3. **Mesurer aux deux échelles** : 300 éléments (la démo) *et* ~3 000. C'est
   précisément d'avoir mesuré à une seule échelle qui a produit ce ticket.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-06**, `080-done` compris.
- `src/engine/scene/Element.js` — `_moved()`.
- `src/engine/scene/CollisionSystem.js` — `recomputeCollisionAggregate()`,
  `updateCollisionBoundingBox()` (le « faire grossir » toujours présent).
- La décision d'origine et sa mesure : `2026-08-03_19-10`.

## Definition of Done

- [ ] À ~3 000 éléments dans une area, le recalcul d'enveloppe **ne domine plus**
      le temps script — mesure avant/après citée.
- [ ] La campagne du fuyard reste à **0 traversée sur 36**.
- [ ] La dérive de l'enveloppe reste bornée — mesure sur une session longue.
- [ ] Le coût est mesuré **aux deux échelles** (≈300 et ≈3 000 éléments).
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
