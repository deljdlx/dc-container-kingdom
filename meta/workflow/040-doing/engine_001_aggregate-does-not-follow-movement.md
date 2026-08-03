---
id: 2026-08-03_19-10
title: La bbox agrégée ne suit pas un enfant qui bouge — le PNJ devient intraversable puis traversable
type: fix
branch: claude/aggregate-follows-movement
created: 2026-08-03 19:10
ready: 2026-08-03 19:12
doing: 2026-08-03 19:13
verify:
done:
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

- [ ] Un élément qui se déplace **reste détectable** : test qui échoue avant
      correction (déplacer un enfant hors de l'agrégat du parent, puis vérifier
      que la détection le trouve encore).
- [ ] **Le cas signalé ne se reproduit plus** : la campagne de 36 approches du
      fuyard ne produit **aucune** traversée — mesurée au navigateur, corps
      contre corps.
- [ ] **Coût mesuré** avant/après : `ms`/frame et appels à
      `updateCollisionBoundingBox` par frame, monde immobile et en marche.
- [ ] La croissance de l'agrégat est **mesurée sur une session** (elle ne doit pas
      rendre l'élagage inutile) — ou la limite est écrite.
- [ ] `npm run verify` vert ; les trois hôtes sans erreur console.

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
