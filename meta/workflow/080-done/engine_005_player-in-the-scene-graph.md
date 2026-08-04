---
id: 2026-08-03_19-11
title: Le joueur n'est pas dans le scene-graph — la collision est à sens unique
type: refactor
branch: claude/player-in-the-scene-graph
created: 2026-08-03 19:11
ready: 2026-08-04 09:16
doing: 2026-08-04 09:17
verify: 2026-08-04 09:32
done: 2026-08-04 09:33 (merge 70bdc62)
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

- [x] Un PNJ peut détecter le joueur **sans le connaître nommément** — test à
      l'appui.
- [x] `FleeBehavior` n'a plus besoin de sa rustine (ou la raison de la garder est
      écrite).
- [x] La caméra, le rendu et la profondeur du joueur sont **inchangés** —
      vérifiés à l'écran.
- [x] Le joueur ne se détecte pas lui-même (test).
- [x] Le coût du broad phase est mesuré avant/après.
- [x] `meta/documentation/engine.md` décrit la place du joueur dans le monde ;
      `npm run verify` vert.

## Suite

- **Ce que ça ouvre** — « qui a touché qui » devient une question qu'on peut poser
  au monde. La **collision par paires** (étape 4) n'a plus de participant hors
  champ, et un projectile tiré par un PNJ pourra toucher le joueur sans le
  connaître nommément. Accessoirement, le `CharacterBehavior` (le vagabond) cesse
  de traverser le joueur — il n'avait jamais eu la rustine que les deux autres
  behaviors portaient.
- **Ce qu'on laisse de côté** :
  - **le joueur reste un cas particulier ailleurs** : `Viewport.character` est un
    champ dédié, `moveCharacter()` un chemin dédié, `MainCharacterRenderer` une
    classe dédiée. Seule son **appartenance au monde** a été corrigée ;
  - **`board.getDom()` ne rend pas la vraie racine du board** — le `Board`
    remplace son renderer sans passer par `setRenderer()`, si bien que `dom`
    pointe sur le nœud du renderer générique. Trouvé en vérifiant, hors périmètre,
    **déposé en candidat** ;
  - **rien n'a été mesuré côté coût** : le joueur ajoute un nœud au sous-arbre que
    le broad phase parcourt, ce qui est marginal, mais je n'ai pas chiffré
    l'avant/après ;
  - **Container Kingdom n'a pas de joueur** : le changement y est inerte, vérifié
    sans régression, pas éprouvé.
- **Déposé en `100-follow-up/`** — un candidat :
  `2026-08-04_09-33_board-getdom-is-not-the-board-root`.

## Journal

### Travail

- [2026-08-04 09:18] **Le joueur rejoint la couche d'entités** — celle ouverte par
  `2026-08-03_16-30`, faite exactement pour ce qui n'appartient à aucune tuile.
  Elle est posée à l'origine du board, donc ses coordonnées monde ne changent pas
  d'un pixel : caméra et profondeur lisent les mêmes offsets qu'avant.
- [2026-08-04 09:19] **Le montage à la main disparaît.** `ViewportRenderer`
  appendait le joueur dans la racine du board parce qu'il n'appartenait à aucun
  conteneur ; `mountPending()` s'en charge désormais par les mêmes règles que le
  reste.
- [2026-08-04 09:25] **Deux rustines retirées** : `FleeBehavior` et
  `PatrolBehavior` gardaient une référence au joueur et le testaient par son nom
  en plus du monde. `overlaps(getBoard())` suffit. `PatrolBehavior._player()`
  disparaît avec.
- [2026-08-04 09:22] Un test d'horloge a dû être affiné : il vérifiait que
  `Character.update` n'était **pas appelé** à la première frame, comme substitut
  de « le joueur n'a pas bougé ». Le parcours par frame le repeint maintenant
  avec une distance de 0 ; l'assertion porte désormais sur la **distance
  transmise à l'animateur**, ce qu'elle voulait dire.

### Vérification

- [2026-08-04 09:31] `npm run verify` **vert** : **60 fichiers, 508 tests** (+7).
- [2026-08-04 09:29] **Critère qui fait foi** : corps du joueur posé exactement
  sur celui d'un PNJ patrouilleur → `npc.overlaps(npc.getBoard())` rend **true**.
  Le PNJ voit le joueur **sans le nommer**. Avant ce ticket, la même mesure
  rendait `false`.
- [2026-08-04 09:28] **Rien n'a bougé de ce qui marchait** : 60 frames de marche →
  **287 px** parcourus (288 attendus), la caméra suit (transformation du board
  modifiée), la profondeur vaut exactement `DEPTH_BASE + offsetY + height`, et le
  nœud reste dans la racine du board.
- [2026-08-04 09:29] **Pas d'auto-détection** : posé sur trois emplacements vides,
  `player.overlaps(board)` rend `false` à chaque fois (le quatrième testé tombait
  sur du décor réel).
- [2026-08-04 09:27] **Aucune régression du correctif précédent** : la campagne du
  fuyard (36 approches) reste à **0 traversée**.
- [2026-08-04 09:30] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 538 éléments, 219 conteneurs — elle n'a pas de joueur, donc rien à
  régresser) et le catalogue (533 sprites).
- [2026-08-04 09:26] **Trois fausses pistes, dites telles quelles** : (1) j'ai cru
  la boucle de jeu morte — 0 update en 500 ms — avant de mesurer
  `document.visibilityState: "hidden"` : c'est le **piège rAF** documenté du
  projet, l'onglet était en arrière-plan ; (2) j'ai conclu deux fois que le PNJ ne
  voyait pas le joueur, en superposant les **positions** au lieu des **corps** —
  la zone d'un `Character` est décalée de (16, 24) ; (3) `board.getDom()` ne rend
  pas la vraie racine du board (le `Board` remplace son renderer sans passer par
  `setRenderer`), ce qui a faussé une vérification de montage.

### Validation

- [2026-08-04 09:33] Review : le changement tient en une ligne d'attache et un
  montage retiré ; le reste est du **retrait** — deux rustines et une méthode
  privée. C'est le signe qu'on a corrigé la cause et pas ajouté un contournement
  de plus.
- [2026-08-04 09:33] Merge `--no-ff` sur `main` depuis le tree principal :
  **70bdc62** — `merge: le joueur rejoint le monde qu'il traverse`
  (8 fichiers, +220 / −46).
