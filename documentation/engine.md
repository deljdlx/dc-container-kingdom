# Le moteur de mini-RPG

Un moteur **vanilla JS, sans framework**, qui rend une carte tuilée façon RPG
dans un conteneur DOM : board scrollable, éléments positionnés, personnages
animés, collisions, events. Il ne connaît **rien** de l'app qui l'embarque.

> Usage rapide, frontière et configuration des chemins d'assets :
> voir **[`src/engine/README.md`](../src/engine/README.md)**. Ce document-ci
> décrit les **concepts internes**. Le détail au niveau code est dans les
> **JSDoc** (exhaustifs) de chaque fichier.

## 1. Scene graph : `Element` et ses sous-systèmes

`Element` est le nœud de base de l'arbre de scène. Plutôt qu'une god-class, il
**compose** des sous-systèmes ; ses méthodes publiques sont de fines façades
au-dessus d'eux :

- **`Geometry`** — `x/y/width/height` **locaux** (relatifs au parent).
- **`SceneGraph`** — enfants, parent, `getChildByName`, et les **offsets absolus**
  (`offsetX/offsetY` = position dans le monde, en accumulant la chaîne de parents).
- **`CollisionSystem`** — zones de collision/trigger, bounding boxes, détection.
- **`EventEmitter`** — events locaux, qui **remontent** ensuite à l'`Application`.
- **`Renderer`** — le nœud DOM et sa mise à jour visuelle.

Coordonnées : **locales** (`x()`, `y()`) vs **monde** (`offsetX()`, `offsetY()`).
La collision et la profondeur raisonnent en coordonnées monde.

## 2. Board, Area et streaming

- **`Area`** — une tuile de carte (taille du viewport) contenant des éléments en
  coordonnées locales.
- **`Board`** — la grille d'`Area`s (un `Element` lui-même).

Pour ne pas charger une carte infinie, le `Viewport` **streame** les areas : il
ne garde qu'une fenêtre **7×7** autour du joueur. Le streaming est **paresseux et
event-driven** : il ne fait un travail que lorsque le joueur **change d'area**
(`_streamAreas` compare aux coords d'area précédentes) — marcher à l'intérieur
d'une area ne coûte rien. Chargement en 7×7, libération au-delà d'un anneau
(hystérésis, pour ne pas thrash sur une frontière).

## 3. Viewport : la game loop

Le `Viewport` porte la **boucle de jeu** (une seule, sur `requestAnimationFrame`) :

```
update(timestamp):
  dt = clamp(timestamp - lastTimestamp, 0, 100)   # clampé : pas de téléport après une pause
  si le joueur bouge : moveCharacter(increment) ; _streamAreas() ; character.update()
  pour chaque behavior enregistré : behavior.update(dt)   # PNJ sur la MÊME horloge
  camera.update() ; renderer.update()
```

Points clés :

- **Une seule horloge.** Joueur et PNJ sont tickés par la même game loop avec le
  même `dt` (les behaviors s'enregistrent via `viewport.addBehavior`). Pas de
  `setTimeout` maison.
- **rAF est en pause quand l'onglet est caché** → tout gèle (voir
  [development.md](development.md) pour tester en pilotage manuel).

## 4. Camera

`Camera` est un objet de première classe qui **suit une cible** (`follow(target)`)
et se centre dessus en espace monde. Elle est **découplée** du personnage : le
joueur se déplace dans le monde, la caméra le suit — ce qui évite le couplage
« caméra bindée en dur au personnage » qui posait problème historiquement.

## 5. Rendu et profondeur (algorithme du peintre)

Chaque `Renderer.render()` synchronise taille / position / profondeur du nœud DOM
avec le modèle, en **n'écrivant que ce qui a changé** (caches `_lastLeft`, etc.).

La **profondeur** (z-index) suit l'algorithme du peintre en espace monde :

```
z = DEPTH_BASE + offsetY() + height()
```

- `offsetY + height` trie par le **bas** de l'élément (ce qui est plus « devant »
  passe au-dessus), de façon cohérente entre areas (la caméra n'affecte jamais z).
- `DEPTH_BASE` (grande constante positive) garde le z **au-dessus du sol** même au
  nord de l'origine, où `offsetY` devient négatif (sinon l'élément passe derrière
  l'herbe, qui est le background des areas à z ≈ 0).

## 6. Collisions

Le `CollisionSystem` fait du **broad + narrow phase** et sépare **détection** et
**réconciliation** :

- **Broad phase** — élague tout sous-arbre dont la bounding box agrégée ne
  recoupe pas (pruning).
- **Narrow phase** — teste les **vraies zones de collision du détecteur** (son
  « corps ») contre les zones de la cible. ⚠️ *À ne pas confondre avec l'agrégat* :
  l'agrégat inclut aussi les zones trigger, donc l'utiliser en narrow phase ferait
  « collisionner » un perso à grand rayon trigger avec tout ce qui l'entoure
  (bug corrigé — la narrow phase utilise les zones, l'agrégat reste pour le broad).
- **Détection** (`_detect`/`_hitZones`) — pure : renvoie les hits, sans events.
- **Réconciliation** (`_reconcile`) — diffe les hits vs la frame précédente et
  n'émet que les events qui changent : `element.collision` / `.collision.end`
  (et pareil pour `trigger`). Pas de « clear » de tout l'arbre à chaque frame.

Deux types de zones :

- **collision** — solides : bloquent le déplacement.
- **trigger** — capteurs : émettent `element.trigger` / `.trigger.end` sans bloquer.

### Passe unique collision + trigger

Le joueur détecte les deux en **une seule traversée** :
`detectCollisionAndTrigger(board)` réconcilie la collision et renvoie les triggers
bruts, que le `Viewport` réconcilie **à la position finale** (après un éventuel
revert de collision) — pour qu'un trigger collé à un mur ne se déclenche pas quand
on tape ce mur. `overlaps(element)` est une variante **pure** (booléen, sans
events), pour une IA qui sonde son déplacement.

### La primitive de déplacement

`Character.moveBlocked(dx, dy, isBlocked)` bouge puis **annule** si le prédicat
`isBlocked()` signale une collision. Le joueur et les behaviors NPC la partagent,
chacun avec sa propre politique de collision.

## 7. Personnages et behaviors

`Character` (un `Element` animé) ne porte **pas** d'IA : elle est déléguée à un
**behavior** interchangeable, tické par la game loop (`update(dt)` qui accumule
le temps et rejoue un pas à la cadence voulue) :

- **`PatrolBehavior`** — allers-retours sur un axe, inverse à distance atteinte
  **ou** sur collision.
- **`FleeBehavior`** — crée une **zone trigger** (rayon de détection) ; quand
  quelque chose y entre (event `element.trigger`), le PNJ fuit à l'opposé.
- **`CharacterBehavior`** — errance aléatoire.

L'animation est isolée dans **`CharacterAnimator`** (horloge de cycle de marche),
et la **bulle de dialogue** passe par le renderer :
`character.quickReaction(html)`, `clearQuickReaction()`, `isReacting()`, plus les
events `element.reaction.show` / `element.reaction.hide`.

## 8. Éléments déclaratifs

Les éléments intégrés (maisons, arbres, clôtures, fleurs, PNJ) sont des
**`SpriteElement`** décrits par un `static descriptor` (atlas, frame, zones de
collision/trigger, `manualZ`) — pas de code de rendu à écrire. Les PNJ
(`CharacterBases/`) sont des `Character` avec un offset de sprite-sheet.

## 9. Events

Tout remonte à l'`Application` via `handle()`. Principaux events (préfixe
`element.`) : `element.click`, `element.collision(.end)`, `element.trigger(.end)`,
`element.reaction.show/hide`, et `map.update` (émis par le Viewport à chaque
déplacement du joueur).

## 10. Debug

`applyDebugFlag()` ajoute la classe `body.debug` si l'URL porte `?debug=1` ;
`viewport.renderDebug()` (auto-gated sur `body.debug`) dessine alors les bounding
boxes et les zones (collision en jaune, trigger en cyan). Les zones **s'allument
en magenta au contact** : `BoundingBox.collided()` toggle la classe `collided` sur
sa boîte de debug (coût nul hors debug — la boîte n'existe pas).

## 11. API publique

Tout passe par **`src/engine/index.js`** : `Application`, `Viewport`, `Camera`,
`Board`, `Area`, `Element`, `SpriteElement`, `Character` ; les sous-systèmes
(`CollisionSystem`, `SceneGraph`, `CharacterAnimator`, `CharacterBehavior`,
`PatrolBehavior`, `FleeBehavior`) ; les renderers ; les éléments intégrés et
bases de personnages ; et la config (`setAssetsBase`, `applyDebugFlag`).
