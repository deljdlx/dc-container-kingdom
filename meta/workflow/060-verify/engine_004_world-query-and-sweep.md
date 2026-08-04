---
id: 2026-08-04_18-32
title: Interroger le monde, et le balayer — la collision par paires
type: feat
branch: claude/world-query-and-sweep
created: 2026-08-04 18:32
ready: 2026-08-04 18:33
doing: 2026-08-04 18:34
verify: 2026-08-04 18:55
done:
---

## Objectif

Étape 4 de la série de blindage, et le dernier prérequis des projectiles. Deux
manques, mesurés.

### 1. On ne peut pas interroger le monde sans en faire partie

La détection est **pilotée par le déplaceur** : `element.overlaps(board)` /
`detectCollisionAndTrigger(board)`. Pour demander « qu'y a-t-il ici ? », il faut
**être** un `Element`, attaché, avec des zones. Un système de dégâts, une IA qui
sonde devant elle, un effet de zone n'ont pas ça — et n'ont aucune raison de
devoir le fabriquer.

### 2. Le tunneling, intermittent

L'enveloppe de collision **suit** le mouvement (`2026-08-03_19-10`) mais ne
l'**anticipe pas** : on teste des positions, jamais le trajet entre elles. Mesuré
le 2026-08-04, un projectile de 6 px contre un corps de PNJ de 14 px, toutes les
phases de départ essayées :

| pas / frame | vitesse (60 fps) | tirs qui traversent sans être vus |
|---|---|---|
| 8 px | 480 px/s | 0 % |
| 20 px | 1 200 px/s | 0 % |
| **24 px** | **1 440 px/s** | **13 %** |
| 32 px | 1 920 px/s | 34 % |
| 48 px | 2 880 px/s | 56 % |
| 64 px | 3 840 px/s | 67 % |

La fenêtre de capture vaut « largeur du projectile + largeur de la cible », soit
20 px ici : au-delà, ça **dépend de la phase** — donc ça rate *parfois*, ce qui est
pire qu'un échec franc. Et à 30 fps le pas double : 720 px/s suffisent à trouer.

## Spécifications

_Amorce — à confirmer en « specify »._

### Une requête, et un balayage

Deux primitives, posées sur le **parcours élagué existant** (pas d'index spatial —
voir plus bas) :

```js
board.query({ x0, y0, x1, y1 }, { type = 'collision' })   // → Element[]
board.sweep(from, to, size, { type })                      // → { element, at } | null
```

- **`query`** répond « qu'y a-t-il dans cette boîte ? » à partir d'un **rectangle
  monde**, sans qu'il faille être dans l'arbre.
- **`sweep`** répond « qu'est-ce que je croise en allant de A à B ? » et rend le
  **premier** contact — ce dont un projectile a besoin.

### Comment le balayage couvre le trajet

Échantillonner la boîte mobile le long du segment, avec un pas **≤ sa plus petite
dimension** : deux échantillons consécutifs se recouvrent alors, leur union
couvre tout le couloir, et rien d'intersectant ne peut passer entre deux.
Coût : `distance / pas` requêtes — pour un projectile de 6 px à 64 px/frame, 11
échantillons par frame, à mesurer.

### Ce qu'on ne fait pas

- **Pas d'index spatial (grille, quadtree).** Le parcours actuel élague par boîte
  agrégée et a été mesuré à 6,4 traversées et ~400 nœuds par frame pour 0,17 ms.
  Une grille se justifiera quand la mesure le dira, pas avant.
- **Pas de résolution** (rebond, glissement, dégâts) : les primitives *répondent*,
  l'appelant décide. `moveBlocked` reste le chemin du personnage.
- **Pas de classe `Projectile` dans le moteur** : la démo en câblera un avec ces
  primitives, ce qui est justement la preuve qu'elles suffisent.

## Firewalls / risques

1. **Ne pas réintroduire les espaces de coordonnées mélangés.** Les requêtes
   parlent en **rectangles monde** bruts, pas en `BoundingBox` — cette classe
   confond deux conventions (`2026-08-04_08-33`) et n'a rien à faire dans une API
   d'interrogation.
2. **Le sur-signalement en diagonale** : approximer le trajet par l'AABB
   départ→arrivée signalerait des cibles jamais touchées. L'échantillonnage
   l'évite ; le vérifier par un test en diagonale.
3. **Le coût du balayage est proportionnel à la vitesse.** Un projectile très
   rapide fait beaucoup d'échantillons : mesurer, et écrire la limite.
4. **`query` ne doit pas se voir elle-même** : il n'y a pas d'élément détecteur,
   donc pas de « se sauter soi-même » — l'appelant doit pouvoir exclure une
   source (son tireur).

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-04**, `080-done` compris.
- `src/engine/scene/CollisionSystem.js` — `_detect`, `_hitZones`, l'élagage à
  réutiliser.
- `src/engine/world/Board.js` — où poser `query` / `sweep`.
- Les quatre étapes déjà closes : `2026-08-02_19-30`, `2026-08-02_20-45`,
  `2026-08-03_09-32`, `2026-08-03_16-30`, `2026-08-03_19-11`, `2026-08-04_17-15`.

## Definition of Done

- [x] `board.query(rect)` rend les éléments dont une zone coupe le rectangle,
      **sans** que l'appelant soit dans l'arbre — test à l'appui.
- [x] `board.sweep(from, to, size)` rend le **premier** élément croisé, et rien
      quand le trajet est libre.
- [x] **Le critère qui fait foi** : la campagne de tunneling ci-dessus repasse à
      **0 % de tirs manqués** jusqu'à 64 px/frame, toutes phases confondues.
- [x] Un test en **diagonale** montre qu'on ne signale pas une cible hors couloir.
- [x] L'appelant peut **exclure une source** (le tireur ne se touche pas).
- [x] **Coût mesuré** : échantillons et ms par balayage, aux vitesses du tableau.
- [x] **La démo tire un projectile** : il part du joueur, vole vite, disparaît au
      contact — preuve visible que les primitives suffisent, sans classe dédiée
      dans le moteur.
- [x] `meta/documentation/engine.md` décrit les deux primitives et la limite du
      balayage ; `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

- [2026-08-04 18:36] **Deux fonctions, pas une classe** : `queryRect` et
  `sweepRect` dans `scene/WorldQuery.js`, plus deux façades sur le `Board`. Elles
  prennent des **rectangles monde bruts** — surtout pas des `BoundingBox`, dont
  les deux conventions de coordonnées (`2026-08-04_08-33`) n'ont rien à faire
  dans une API d'interrogation.
- [2026-08-04 18:38] **Le pas du balayage est ≤ la plus petite dimension du
  mobile.** C'est ce qui garantit que deux échantillons consécutifs se recouvrent
  et que leur union couvre le couloir : rien d'intersectant ne peut passer entre
  deux. Approximer le trajet par l'AABB départ→arrivée aurait été plus simple et
  faux — un test en diagonale le montre.
- [2026-08-04 18:39] **`exclude` plutôt qu'un « ne pas se voir soi-même »
  implicite** : sans élément détecteur, il n'y a personne à sauter d'office. Le
  tireur est la seule information que l'appelant possède.
- [2026-08-04 18:45] **La démo tire, sans classe `Projectile` dans le moteur** :
  une entité sur la couche, un behavior qui la déplace, `sweep()` pour savoir ce
  qu'elle croise. C'est la preuve que les primitives suffisent — si elles avaient
  demandé une classe dédiée, c'est qu'elles étaient incomplètes.

### Vérification

- [2026-08-04 18:54] `npm run verify` **vert** : **62 fichiers, 527 tests** (+14).
- [2026-08-04 18:42] **Critère qui fait foi** : la campagne de tunneling qui a
  ouvert le ticket — 6 vitesses × toutes les phases de départ — repasse de
  **13 à 67 % de tirs manqués** à **0 %**, jusqu'à 64 px/frame (3 840 px/s).
- [2026-08-04 18:48] **Les deux branches prouvées dans la vraie démo** : tir vers
  un PNJ → contact sur un `Man02` après **58 px** ; tir vers le vide → **994 px**
  parcourus puis disparition par épuisement de portée (1 000 px).
- [2026-08-04 18:51] **Coût mesuré**, projectiles à 900 px/s :

  | | balayages / frame | échantillons / frame | ms / frame |
  |---|---|---|---|
  | 1 projectile | 1,0 | 3,0 | 0,220 |
  | 10 projectiles | 10,7 | 32,1 | 0,250 |
  | 40 projectiles | 47,2 | 141,6 | **0,637** |

  Linéaire, et 40 projectiles simultanés tiennent dans 4 % du budget d'une frame.
- [2026-08-04 18:41] **La diagonale ne sur-signale pas** : une cible posée dans le
  coin de la boîte englobante départ→arrivée, hors du couloir, n'est pas
  rapportée — test dédié.
- [2026-08-04 18:53] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 537 éléments, 219 conteneurs) et le catalogue (535 sprites).
- [2026-08-04 18:52] Sondes retirées (0 résidu).

### Validation

-
