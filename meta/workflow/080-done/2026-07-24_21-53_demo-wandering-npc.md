---
id: 2026-07-24_21-53
title: Démo — un PNJ en errance (CharacterBehavior)
type: chore
branch: claude/demo-wandering-npc
created: 2026-07-24 21:53
ready: 2026-07-25 17:08
doing: 2026-07-25 17:12
verify: 2026-07-25 17:13
done: 2026-07-25 17:16
merge: 0efa077
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

- [x] Un PNJ instancié dans la démo avec `CharacterBehavior` actif (errance visible).
- [x] Pas de régression (foule + collisions toujours OK).

## Vérification

- [x] `npm run verify` vert
- [x] errance visible au navigateur (pilotage manuel rAF si l'onglet est en fond —
      `meta/recipes/verify-in-browser.md`)

## Journal

### Travail

- [2026-07-25 17:12] PNJ errant ajouté dans `src/engine/demo/demo.js` : `Woman00`
  posée en (180, 60) dans l'area d'origine (coin dégagé, visible au chargement),
  puis `wanderer.live(3000)`. Aucun behavior instancié à la main — `Character`
  compose déjà son `CharacterBehavior`, contrairement à `PatrolBehavior` /
  `FleeBehavior`. Ordre imposé : `addElement` **avant** `live()`, sinon
  `getApplication()` est nul et le behavior ne s'enregistre pas dans la game loop.
- [2026-07-25 17:13] `meta/documentation/development.md` mise à jour (l'inventaire
  des PNJ de la démo y est décrit) — aucun autre doc ne détaille la démo.

### Vérification

- [2026-07-25 17:14] `npm run verify` vert : lint + build (508 ms) + 168 tests
  (21 fichiers), inchangé par rapport à avant le ticket.
- [2026-07-25 17:13] Navigateur (`vite --port 5199`, `/engine/demo/`), boucle
  pilotée à la main (`viewport.update(t)`, 1200 frames de 16 ms via un hook
  temporaire) : le PNJ parcourt les 4 directions, avance de 6 px par tick de
  100 ms et repart dans une autre direction quand il bute (ex. `right` → `left`
  au contact d'un patrouilleur). `viewport._behaviors.length === 10`
  (8 patrouilles + fuyard + errant) → pas de régression sur la foule.
- [2026-07-25 17:13] rAF réel (onglet au premier plan) : déplacement confirmé sur
  2 s ; 0 erreur console.
- [2026-07-25 17:14] Hook de debug retiré, `verify` rejoué vert après nettoyage.
- **Observation** : l'errance étant une marche aléatoire sans laisse, le PNJ finit
  par s'éloigner de l'area d'origine (~1 area par minute). C'est le comportement
  du behavior tel quel ; borner l'errance demanderait une option moteur — hors
  périmètre de ce ticket.

### Validation

- [2026-07-25 17:16] DoD cochée, diff conforme aux règles (démo seule, moteur
  intact, import via `src/engine/index.js`, aucun résidu de debug). Merge `--no-ff`
  sur `main` : `0efa077`. Branche `claude/demo-wandering-npc` supprimée.
