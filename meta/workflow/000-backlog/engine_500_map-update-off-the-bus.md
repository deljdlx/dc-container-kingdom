---
id: 2026-08-02_20-52
title: map.update viole la règle du bus — trancher son sort
type: refactor
branch:
created: 2026-08-02 20:52
ready:
doing:
verify:
done:
---

## Objectif

Le bus d'events (`2026-08-02_19-30`) a posé la règle : **il porte les faits de
jeu, pas les pas de simulation**. `map.update` est du mauvais côté — il est émis
par `Viewport.moveCharacter()` à **chaque frame où le joueur se déplace**, avec un
payload alloué à chaque fois.

Il a été conservé tel quel parce que `ContainerKingdomLayout.js:247` s'y abonne
pour se resynchroniser. Résultat : le seul contre-exemple vivant de la règle
qu'on vient d'écrire figure dans le catalogue `EngineEvents`, où il se lit comme
un modèle à copier.

Avec des projectiles, le réflexe « j'émets à chaque frame » coûtera cher — et la
console d'events le noiera.

## Spécifications

_À confirmer en « specify »._ Trois issues possibles :

- **Le sortir du bus** au profit d'un abonnement direct au `Viewport` — ce dont
  Container Kingdom a réellement besoin (il écoute *son* viewport, pas le monde).
- **Le renommer** pour que son statut soit lisible (`viewport.tick`…), et l'écrire
  comme l'exception qu'il est.
- **Assumer** et documenter — mais alors la règle doit dire pourquoi lui.

## Contexte / liens

- Origine : rubrique `Suite` du ticket `2026-08-02_19-30`, candidat trié le
  2026-08-02.
- `src/engine/view/Viewport.js` — `moveCharacter()`, l'émission.
- `src/engine/events/EngineEvents.js` — `MAP_UPDATE` et la règle, écrite juste
  au-dessus.
- `src/container-kingdom/js/ContainerKingdomLayout.js:247` — le seul abonné.
- `meta/documentation/engine.md` §9.

## Definition of Done

- [ ] Le sort de `map.update` est **tranché et écrit** dans `engine.md` §9.
- [ ] Container Kingdom continue de se resynchroniser (vérifié au navigateur).
- [ ] Si retiré du bus : plus aucun event émis par frame dans le moteur.
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
