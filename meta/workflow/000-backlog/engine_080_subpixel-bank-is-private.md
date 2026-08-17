---
id: 2026-08-17_18-21
title: La banque de sous-pixels est privée au viewport
type: fix
branch:
created: 2026-08-17 18:21
ready:
doing:
verify:
done:
---

## Objectif

Trouvé en écrivant l'arène (`2026-08-11_08-55`).

`Coordinates` **arrondit chaque écriture** au pixel. Le `Viewport` le sait et
met le reste en banque pour le joueur (« sous un pixel par frame, chaque frame
arrondissait à zéro : le personnage ne partait jamais »).

Mais cette banque est **dans la boucle, pour le joueur seul**. Tout autre mobile
lent doit la réécrire : mes assaillants avancent à 14 px/s, soit 0,23 px par
frame, et sont restés **parfaitement immobiles** — position réécrite, arrondie,
inchangée, indéfiniment. Rien ne prévient : ni erreur, ni ralentissement, juste
un objet qui ne bouge pas.

Ce qui manque est une primitive : « avance cet élément de `dx, dy` en gardant le
reste ». Elle existe déjà à moitié dans `Character.moveBlocked`, qui prend des
entiers.

À noter : `2026-07-26_14-25` (le déplacement vers une cible, mort et faux) a
exactement le même défaut — un pas par frame, pas de reste — donc les deux se
traitent probablement ensemble.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-11_08-55`, trié le 2026-08-17.
- `src/engine/scene/Coordinates.js` — l'arrondi à chaque écriture.
- `src/engine/view/Viewport.js` — `_moveRemainderX/Y`, la banque à extraire.
- `src/engine/character/Character.js` — `moveBlocked`, qui prend des entiers.
- **Consommateur direct** : `2026-07-26_14-25` (le déplacement vers une cible,
  mort et faux) souffre du même défaut — les deux se traitent ensemble.

## Definition of Done

- [ ] Un mobile lent (< 1 px/frame) **avance** — test, et mesure à l'écran.
- [ ] La primitive est publique et utilisée par le viewport lui-même : une seule
      banque, pas deux implémentations.
- [ ] Le joueur ne régresse pas : diagonale normalisée, pas de saut à l'arrêt.
- [ ] JSDoc + `documentation/engine.md` ; `npm run verify` vert.

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
