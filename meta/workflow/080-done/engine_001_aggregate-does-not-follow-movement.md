---
id: 2026-08-03_19-10
title: La bbox agrégée ne suit pas un enfant qui bouge — le PNJ devient intraversable puis traversable
type: fix
branch: claude/aggregate-follows-movement
created: 2026-08-03 19:10
ready: 2026-08-03 19:12
doing: 2026-08-03 19:13
verify: 2026-08-04 08:32
done: 2026-08-04 08:34 (merge 8e696bf)
---

## Objectif

Signalé à l'usage le 2026-08-03 : « le personnage fuyant est buggué au niveau des
collisions, on arrive à le traverser parfois ». Ce n'est pas le comportement de
fuite : c'est **la détection qui cesse de voir le PNJ**.

Le broad phase élague par **boîte agrégée** avant de descendre dans une area. Or
cette boîte **ne suit pas un enfant qui se déplace**. Mesuré au navigateur, à
l'instant exact de la traversée :

| | |
|---|---|
| corps du joueur | y **555 → 567** |
| corps du fuyard | y **544 → 556** — ils se chevauchent |
| agrégat de l'area (0,0) | y 84 → **544** |
| `player.getCollision(board)` | **false** |

Le fuyard a dérivé **hors de la boîte agrégée de sa propre area**. Le broad phase
élague donc toute l'area, et le PNJ devient **intangible** — alors que sa propre
boîte, elle, chevauche bien celle du joueur (`playerVsShy: true`,
`playerVsArea: false`).

**Confirmation en une ligne** : forcer `area.updateCollisionBoundingBox(shy)` sur
l'état fautif fait passer l'agrégat de `y1 = 544` à `y1 = 678`, et le moteur voit
**immédiatement** la collision.

### Pourquoi « parfois », et pourquoi lui

L'agrégat est calculé à l'**ajout** d'un enfant, puis rafraîchi seulement quand le
parcours de l'arbre atteint cet enfant (`Element.update()` appelle
`parent.updateCollisionBoundingBox(this)`). Un personnage qui marche ne lève
jamais le drapeau de redessin — il se repeint lui-même — donc le parcours ne
descend pas jusqu'à lui.

Le défaut ne se voit donc que pour un PNJ qui **s'éloigne assez de l'endroit où
il a été posé**. Les patrouilleurs restent dans leur amplitude ; le **fuyard
dérive** — il s'éloigne du joueur sans jamais revenir. 3 traversées sur 36
approches testées, toutes après dérive, aucune depuis sa position initiale.

### Ce n'est pas une régression

`parent.updateCollisionBoundingBox(this)` est dans `Element.update()` **depuis le
commit initial** (`e173ca9`, vérifié par `git log -L`). Le défaut est d'origine.

## Spécifications

### Le fond : un cache sans invalidation sur la mutation qui compte

L'agrégat est un **cache** de l'union des boîtes des enfants. Trois chemins le
maintiennent — `createCollisionZone`, `updateCollisionBoundingBox` (via le
parcours d'arbre), `recomputeAggregates` (au détachement) — et **aucun n'est
déclenché par le déplacement**, la seule mutation qui l'invalide vraiment.

### La correction

Rafraîchir l'agrégat du parent **quand la position change**, c'est-à-dire dans les
setters `Element.x()` / `Element.y()` — le point de mutation réel, qui couvre tout
(personnages, entités, déplacement vers cible) plutôt qu'un appelant particulier.

L'invariant à rétablir : **agrégat ⊇ union des boîtes des enfants**. Le faire
*grossir* suffit à la correction — une boîte trop large rend le broad phase moins
mordant, jamais faux. La rétrécir est une optimisation, pas une exigence, et
`recomputeAggregates()` sait déjà le faire.

### À mesurer, pas à supposer

`updateCollisionBoundingBox` remonte la chaîne des parents à chaque appel. Avec
un setter appelé plusieurs fois par frame et par entité mobile, le coût doit être
**mesuré avant/après** — et comparé à la croissance de l'agrégat, qui affaiblit
l'élagage si elle n'est jamais reprise.

## Firewalls / risques

1. **`moveBlocked` écrit la position deux fois** (tentative puis retour) : l'agrégat
   gardera la trace de la position tentée. Sans conséquence sur la justesse, à
   noter.
2. **Ne pas rétrécir dans le même geste** : `recomputeAggregates()` est O(enfants)
   et remonte l'arbre ; l'appeler à chaque déplacement coûterait bien plus que le
   défaut.
3. **Le trou de test** : rien ne couvre « un élément qui se déplace reste
   détectable ». C'est ce trou qui a laissé passer un défaut vieux comme le dépôt.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-03**, `080-done` compris.
  `2026-07-26_14-18` traite la boîte qui ne rétrécit **pas** au détachement — pas
  celle qui ne suit pas le mouvement.
- `src/engine/scene/CollisionSystem.js` — `updateCollisionBoundingBox`,
  `recomputeAggregates`, `_detect` (l'élagage).
- `src/engine/scene/Element.js` — `x()`, `y()`, `update()`.
- `src/engine/character/FleeBehavior.js` — le PNJ qui dérive.
- **Le défaut d'architecture voisin**, trouvé en enquêtant :
  `2026-08-03_19-11` (le joueur hors du scene-graph).

## Definition of Done

- [x] Un élément qui se déplace **reste détectable** : test qui échoue avant
      correction (déplacer un enfant hors de l'agrégat du parent, puis vérifier
      que la détection le trouve encore).
- [x] **Le cas signalé ne se reproduit plus** : la campagne de 36 approches du
      fuyard ne produit **aucune** traversée — mesurée au navigateur, corps
      contre corps.
- [x] **Coût mesuré** avant/après : `ms`/frame et appels à
      `updateCollisionBoundingBox` par frame, monde immobile et en marche.
- [x] La croissance de l'agrégat est **mesurée sur une session** (elle ne doit pas
      rendre l'élagage inutile) — ou la limite est écrite.
- [x] `npm run verify` vert ; les trois hôtes sans erreur console.

## Suite

- **Ce que ça ouvre** — l'invariant « enveloppe ⊇ enfants » tient enfin sous le
  mouvement, ce dont dépendent la collision par paires (étape 4) et les
  projectiles (étape 5) : une entité qui traverse la carte reste détectable tout
  du long.
- **Ce qu'on laisse de côté** :
  - **`BoundingBox` mélange deux espaces de coordonnées** — trouvé en corrigeant,
    évité plutôt que traité (le déplacement ne recalcule que l'enveloppe de
    collision, saine). **Ticket ouvert** : `2026-08-04_08-33` ;
  - **le joueur reste hors du scene-graph** — le défaut d'architecture derrière ce
    bug, ticket `2026-08-03_19-11`. Tant qu'il tient, un PNJ ne peut pas détecter
    le joueur sans le connaître nommément ;
  - **l'enveloppe suit, elle n'anticipe pas** : le recalcul a lieu *après* le
    déplacement. Une entité assez rapide pour traverser une zone entre deux
    frames restera invisible au broad phase — c'est le tunneling, et il relève de
    la collision continue (étape 4) ;
  - **mesuré sur la démo seulement** : Container Kingdom n'a pas d'entité mobile,
    le coût y est donc a priori moindre, mais je ne l'ai pas chiffré.
- **Déposé en `100-follow-up/`** — aucun : les deux pistes qui méritaient une
  décision sont déjà des tickets.

## Journal

### Travail

- [2026-08-03 19:15] **Le test d'abord** : cinq cas qui échouent avant correction
  (enfant déplacé sur un axe, sur deux, imbriqué à deux niveaux…). Quatre rouges,
  le cinquième — « ne pas détecter ce qui est vraiment ailleurs » — vert dès le
  départ, ce qui garantit qu'on ne corrige pas en élargissant tout.
- [2026-08-03 19:16] **Le correctif est au point de mutation** : les setters
  `Element.x()` / `y()`, et non un appelant particulier. C'est là que la position
  change, donc là que l'enveloppe devient fausse.
- [2026-08-04 08:20] **Grossir ou recalculer — mesuré, pas supposé.** J'avais
  spécifié « faire grossir suffit ». C'est vrai pour la justesse, mais mesuré sur
  la démo : l'enveloppe de l'area d'origine atteignait **3,7× sa propre tuile
  (+144 % en 25 s)**. En recalculant, elle reste le vrai contour des enfants
  (**+70 %, 2,31×**) — **à 60 fps dans les deux cas**. Le recalcul gagne sans
  contrepartie ; la spec disait le contraire, la mesure a tranché.
- [2026-08-04 08:26] **Un second défaut mis au jour par le correctif.**
  `recomputeAggregates()` recalcule *aussi* la boîte de rendu, et celle-ci est
  amorcée dans l'espace du **parent** puis fusionnée avec des enfants exprimés
  dans l'espace de l'**élément** — deux espaces dans une même boîte. Invisible
  jusqu'ici parce que le recalcul ne tournait qu'à la racine (en 0,0, où le
  double comptage vaut zéro). Un test de streaming l'a attrapé : 290 au lieu de
  200.
  **Je ne l'ai pas corrigé en passant** : j'ai extrait `recomputeCollisionAggregate()`
  — la moitié dont le broad phase a besoin — et le déplacement n'appelle que
  celle-là. C'est aussi moins de travail par frame : la boîte de rendu n'est lue
  par aucune détection. Le défaut d'espaces part en ticket propre.

### Vérification

- [2026-08-04 08:31] `npm run verify` **vert** : **59 fichiers, 501 tests** (+5).
- [2026-08-04 08:24] **Critère qui fait foi** : la campagne qui produisait le bug
  — 36 approches du fuyard, quatre directions × trois distances × trois décalages
  — passe de **3 traversées à 0**, corps contre corps mesurés à chaque frame.
- [2026-08-04 08:30] **Coût négligeable** : **60,0 / 60,1 fps** (monde immobile et
  joueur en marche), **9,6 à 10,2 recalculs d'enveloppe par frame**. Aucune
  dégradation mesurable.
- [2026-08-04 08:30] **L'enveloppe ne s'emballe pas** : celle de l'area d'origine
  passe de 684 à 1164 kpx² en 20 s de vie autonome (**2,31× la tuile**), et c'est
  le contour réel des PNJ qui se sont dispersés — pas une dérive. Avec la variante
  « faire grossir », elle atteignait 3,7×.
- [2026-08-04 08:22] Une mesure de croissance jetée en route : la première
  comparait la surface agrégée de **toutes** les areas chargées avant/après une
  marche — or le streaming avait changé l'ensemble des areas. Refaite sur une area
  fixe.

### Validation

- [2026-08-04 08:34] Review : le correctif tient dans les setters `x()`/`y()` et
  une méthode extraite. Le geste qui compte est le **choix de ne pas** corriger le
  défaut d'espaces de coordonnées au passage : il est isolé, ticketé, et le
  chemin chaud l'évite.
- [2026-08-04 08:34] Merge `--no-ff` sur `main` depuis le tree principal :
  **8e696bf** — `merge: l'enveloppe de collision suit l'élément qui bouge`
  (4 fichiers, +219 / −24).
