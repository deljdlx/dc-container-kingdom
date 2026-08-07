---
id: 2026-08-06_17-20
title: Le recalcul d'enveloppe est linéaire en enfants et domine à l'échelle
type: fix
branch: claude/aggregate-grow-and-tighten
created: 2026-08-06 17:20
ready: 2026-08-07 18:32
doing: 2026-08-07 18:33
verify: 2026-08-07 18:52
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

- [x] À ~3 000 éléments dans une area, le recalcul d'enveloppe **ne domine plus**
      le temps script — mesure avant/après citée.
- [x] La campagne du fuyard reste à **0 traversée sur 36**.
- [x] La dérive de l'enveloppe reste bornée — mesure sur une session longue.
- [x] Le coût est mesuré **aux deux échelles** (≈300 et ≈3 000 éléments).
- [x] `npm run verify` vert.

## Suite

- **aucune.** Le ticket proposait un resserrage épisodique ; la mesure a montré
  qu'il n'a pas lieu d'être (voir *Vérification*). Rien à reporter.
- Le vrai enseignement dépasse ce ticket et est déjà consigné hors périmètre :
  **une mesure de perf faite à une seule échelle ne conclut rien**. C'est la
  deuxième fois qu'une décision validée sur la démo nue (≈300 éléments) se
  retourne à l'échelle.

## Journal

### Travail

- **Une ligne.** `Element._moved()` appelait `parent.recomputeCollisionAggregate()`
  (O(enfants du parent), à chaque pas de chaque mobile) ; il appelle désormais
  `parent.updateCollisionBoundingBox(this)` (O(1)). Les deux gestes existaient
  déjà — c'est le choix entre eux qui était mauvais.
- **La spécification n'a pas été suivie jusqu'au bout, et c'est le résultat de la
  mesure.** Elle demandait de « découpler les deux gestes » : grossir à chaque
  déplacement *et* recalculer épisodiquement pour resserrer, sur un seuil à
  mesurer. Le seuil mesuré n'existe pas : la dérive **plafonne d'elle-même**,
  parce que `removeChild` recalcule déjà (streaming d'area, despawn d'entité).
  Ajouter un resserrage périodique aurait été du code, un réglage et un risque en
  échange de rien. Le firewall n° 2 (« le coût du resserrage se déplace ») tombe
  avec lui.
- La justification en JSDoc de `_moved()` — qui argumentait *pour* le recalcul en
  citant la mesure à 300 éléments — a été réécrite avec les deux échelles.
- Doc : nouvelle sous-section « L'enveloppe suit le mouvement — en grossissant »
  dans `documentation/engine.md` §6, qui porte la justesse (les 3 traversées) et
  le coût (les deux échelles) au même endroit.

### Vérification

Mesures au navigateur sur `/engine/demo/`, joueur en marche, moyenne sur 600
frames. Le monde à ~3 500 éléments est peuplé par le même script qu'à l'audit B.

| | 300 éléments | 3 500 éléments |
|---|---|---|
| temps script / frame | 0,222 ms | **2,518 ms** (avant : 12,3) |
| dont enveloppe | 0,013 ms — 6 % | **0,032 ms — 1 %** (avant : 6,3 ms — 51 %) |
| appels / frame | 30,2 | 42,5 |
| enveloppe de l'area | 1,17× sa tuile | 1,38× sa tuile |

- **Dérive bornée, session longue** : l'enveloppe de l'area d'origine monte de
  2,18× à 2,54× sa tuile pendant les dix premières secondes, puis **ne bouge plus
  jusqu'à 80 s**. Celle de la couche d'entités **diminue** — 2 457 → 653 kpx²
  après 200 projectiles tirés et despawnés — chaque `despawn` recalculant.
- **Justesse** : campagne du fuyard rejouée, **0 traversée sur 36 approches**
  (le repère de `2026-08-03_19-10`).
- `npm run verify` vert : 64 fichiers, **545 tests**.
- Les trois hôtes (app, démo, catalogue) chargés sans erreur console. Sonde
  `window.__vp` retirée de `demo.js` après mesure (vérifié : 0 résidu).

### Validation

- Fusionné sur `main` en `--no-ff`.
