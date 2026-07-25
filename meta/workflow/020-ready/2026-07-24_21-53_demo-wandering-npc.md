---
id: 2026-07-24_21-53
title: Démo — un PNJ en errance (CharacterBehavior)
type: chore
branch:
created: 2026-07-24 21:53
ready: 2026-07-25 17:08
---

## Objectif

Exercer le behavior d'errance (aujourd'hui dormant) en ajoutant **un** PNJ qui
erre dans la démo, en plus des patrouilleurs et du fuyard. Petit ajout démo.

## Contexte / liens

- `src/engine/demo/demo.js`
- `src/engine/map/CharacterBehavior.js` (`.live(...)`), exporté par `src/engine/index.js`
- Recipe projet : `meta/recipes/add-npc-behavior.md`

## Spécifications

### Fonctionnel

- Un PNJ supplémentaire dans l'area d'origine de la démo, **visiblement errant** :
  il change de direction au hasard toutes les quelques secondes et repart dans une
  autre direction quand il bute sur un décor / un autre personnage.
- Il reste **collidable** comme les autres PNJ (le joueur est bloqué au contact).
- Les PNJ existants (8 patrouilleurs, 2 immobiles, Cain, le fuyard) sont
  inchangés.

### Technique

- Modification limitée à `src/engine/demo/demo.js` — **aucun** changement du
  moteur (frontière : la démo consomme le moteur via `src/engine/index.js`).
- L'errance passe par `Character.live(actionDuration)`, qui délègue au
  `CharacterBehavior` déjà composé par `Character` (pas besoin d'instancier le
  behavior à la main comme `PatrolBehavior` / `FleeBehavior`).
- `live()` s'enregistre auprès du viewport via
  `character.getApplication().getViewport()` : le PNJ doit donc être **ajouté à
  une area avant** l'appel (comme le fuyard, `FleeBehavior#start`).
- Choisir une base de personnage du sheet partagé et une position dégagée pour que
  l'errance soit visible d'entrée (pas coincée dans un décor).

## Definition of Done

- [ ] Un PNJ instancié dans la démo avec `CharacterBehavior` actif (errance visible).
- [ ] Pas de régression (foule + collisions toujours OK).

## Vérification

- [ ] `npm run verify` vert
- [ ] errance visible au navigateur (pilotage manuel rAF si l'onglet est en fond —
      `meta/recipes/verify-in-browser.md`)

## Journal

-
