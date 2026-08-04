---
id: 2026-08-03_19-11
title: Le joueur n'est pas dans le scene-graph — la collision est à sens unique
type: refactor
branch:
created: 2026-08-03 19:11
ready: 2026-08-04 08:40
doing:
verify:
done:
---

## Objectif

Trouvé en enquêtant sur `2026-08-03_19-10`, et plus profond que lui.

`Viewport.enableMainCharacter()` crée le personnage joueur et ne l'**attache à
rien** : il n'est enfant ni du board, ni d'une area. Mesuré le 2026-08-03, joueur
posé exactement sur un PNJ, corps qui se touchent :

| question | réponse |
|---|---|
| les corps se touchent-ils ? | **oui** |
| le joueur est-il dans le scene-graph ? | **non** (`getParent()` → falsy) |
| le **joueur** voit-il le PNJ ? | **oui** — `player.getCollision(board)` |
| le **PNJ** voit-il le joueur via le monde ? | **non** — `npc.overlaps(board)` |
| le PNJ le voit-il si on le lui désigne ? | oui — `npc.overlaps(player)` |

**La collision est asymétrique par construction** : le joueur est un détecteur de
première classe, mais pas un participant détectable. Il n'existe pas dans le
monde que les autres interrogent.

### Ce que ça coûte déjà

`FleeBehavior` ne peut pas se contenter de « suis-je bloqué par le monde ? » : il
doit garder une référence explicite à sa menace et tester
`character.overlaps(this._threat)` **en plus** de `overlaps(board)`. Ce n'est pas
une élégance du behavior, c'est **la rustine qui compense l'absence du joueur dans
l'arbre**. Tout PNJ qui doit réagir au joueur devra la refaire.

### Ce que ça bloquera

L'étape 4 de la feuille de route est la **collision par paires**, et l'étape 5 les
**projectiles**. Leur question est littéralement « qui a touché qui ». On ne peut
pas y répondre tant qu'un des participants est **hors du monde** : un projectile
tiré par un PNJ ne pourrait pas toucher le joueur sans le connaître nommément.

## Spécifications

_À confirmer en « specify »._ Deux directions, à trancher :

- **Attacher le joueur au monde.** Il devient un enfant — de la **couche
  d'entités** (`2026-08-03_16-30`), qui existe précisément pour ce qui
  n'appartient à aucune tuile. Le broad phase le voit alors comme tout le monde.
  À vérifier : la caméra le suit toujours, `MainCharacterRenderer` le monte
  toujours au bon endroit, et il ne se détecte pas lui-même.
- **Assumer l'asymétrie** et fournir l'outil qui manque : une requête
  « qu'y a-t-il ici ? » sur le monde **plus** les acteurs, que projectiles et
  behaviors utiliseraient au lieu de connaître leurs cibles. C'est déjà la moitié
  de l'étape 4.

## Firewalls / risques

1. **Le joueur ne doit pas se détecter lui-même** : `_detect` saute
   `this._element`, mais pas un joueur atteint par un autre chemin.
2. **Le personnage principal a son propre renderer** (`MainCharacterRenderer`,
   monté dans le conteneur du viewport, pas dans la racine du board). L'attacher
   au scene-graph ne doit pas changer où il est peint — ni sa profondeur.
3. **La caméra suit le joueur** : elle lit ses offsets, qui deviendraient
   relatifs à un parent. À vérifier plutôt qu'à supposer.
4. **`Viewport.moveCharacter` part du board** pour détecter. Si le joueur est
   dans le board, il faut s'assurer qu'il ne se voit pas lui-même **et** que
   l'élagage reste efficace.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-03**, `080-done` compris.
- `src/engine/view/Viewport.js` — `enableMainCharacter()`, `moveCharacter()`.
- `src/engine/character/FleeBehavior.js` — `_isBlocked()`, la rustine.
- `src/engine/world/Board.js` — la couche d'entités, candidat naturel d'accueil.
- `src/engine/render/MainCharacterRenderer.js`.
- Le bug qui a mené ici : `2026-08-03_19-10`.
- À traiter **avant ou avec** l'étape 4 (collision par paires).

## Definition of Done

- [ ] Un PNJ peut détecter le joueur **sans le connaître nommément** — test à
      l'appui.
- [ ] `FleeBehavior` n'a plus besoin de sa rustine (ou la raison de la garder est
      écrite).
- [ ] La caméra, le rendu et la profondeur du joueur sont **inchangés** —
      vérifiés à l'écran.
- [ ] Le joueur ne se détecte pas lui-même (test).
- [ ] Le coût du broad phase est mesuré avant/après.
- [ ] `meta/documentation/engine.md` décrit la place du joueur dans le monde ;
      `npm run verify` vert.

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
