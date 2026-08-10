---
id: 2026-08-10_15-35
title: Déplacer les PNJ au dt, comme le joueur
type: refactor
branch:
created: 2026-08-10 15:35
ready:
doing:
verify:
done:
---

## Objectif

Déposé à la clôture de `2026-08-08_17-55` (l'horloge du moteur).

Les behaviors déplacent les PNJ par **pas de 4 px toutes les 60 ms** (patrouille)
ou 100 ms (errance) — soit un sixième des frames. C'est cette cadence grossière
que la transition CSS de `character.css` masque, et c'est pour elle que
l'horloge doit maintenant dicter au navigateur une durée de transition
(`--engine-step-duration`).

Le joueur, lui, ne connaît pas ce problème : il avance de `dt × vitesse` pixels
avec mise en banque du sous-pixel, donc **chaque frame**, et il est en
`transition: none`.

Si les behaviors adoptaient la même primitive, la transition CSS n'aurait plus
rien à masquer : on pourrait la supprimer, et avec elle la seule source de temps
que le moteur ne possède pas.

À peser : la cadence sert peut-être aussi le *comportement* (une IA qui décide
16 fois par seconde plutôt que 60). Déplacement et décision peuvent se séparer —
décider à la cadence, se déplacer au `dt`.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-10**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-08_17-55` (l'horloge), trié
  le 2026-08-10.
- `src/engine/character/CharacterBehavior.js`, `PatrolBehavior.js`,
  `FleeBehavior.js` — la cadence (`_tickDelay`) et le pas (`_speed`).
- `src/engine/view/Viewport.js` — la primitive du joueur : `dt × vitesse` avec
  mise en banque du sous-pixel.
- `src/engine/css/character.css` — la transition à supprimer si ça marche.
- `src/engine/render/ViewportRenderer.js` — `applyClockState()`, l'outillage qui
  deviendrait inutile.

## Definition of Done

- [ ] Les PNJ se déplacent **chaque frame**, au `dt`, sous-pixel mis en banque.
- [ ] La décision (changer de direction, faire demi-tour) garde **sa** cadence :
      une IA n'a pas à décider 60 fois par seconde.
- [ ] La transition CSS des personnages est **supprimée**, avec elle
      `--engine-step-duration` et `engine--frozen` s'ils n'ont plus d'usage.
- [ ] Rendu comparé avant / après au navigateur : pas plus saccadé.
- [ ] Campagne du fuyard : 0 traversée sur 36.
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
