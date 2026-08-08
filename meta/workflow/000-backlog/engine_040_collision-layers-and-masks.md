---
id: 2026-08-08_17-57
title: Des couches de collision et des masques, pour que tout ne touche pas tout
type: feat
branch:
created: 2026-08-08 17:57
ready:
doing:
verify:
done:
---

## Objectif

Dans le moteur, **tout entre en collision avec tout**. Une zone de collision est
solide, une zone trigger est un capteur, et c'est la seule distinction qui
existe : rien ne dit *qui* peut toucher *quoi*.

Le contournement est déjà dans le code : `queryRect` / `sweepRect` prennent un
`exclude: [...]` — un **tableau d'éléments passé à la main**, testé par
`includes()` pour chaque candidat. Le projectile de la démo s'exclut lui-même et
exclut le tireur. Ça tient à un tir. À vingt projectiles, dix PNJ et deux camps,
il faudrait construire ce tableau à chaque tir, en O(n), et se souvenir de
n'oublier personne — c'est-à-dire réécrire un système d'appartenance, mal, dans
chaque hôte.

Ce qui manque est le concept classique et bon marché : une **couche** portée par
la zone, un **masque** porté par l'interrogation.

## Spécifications

_À confirmer en « specify »._

- **Une couche par zone** (pas par élément) : un personnage peut avoir un corps
  `body` et un capteur de vue `sense`, qui ne s'interrogent pas pareil.
- **Un masque à l'interrogation** : « ce tir touche `enemy` et `wall`, pas
  `player` ni `pickup` ». À trancher en *specify* : jeu de noms (lisible,
  débogable, `Set`) ou champ de bits (rapide, opaque). Le nombre de couches
  attendu est petit — trancher sur une mesure, pas sur l'habitude.
- **Défauts rétrocompatibles** : une zone sans couche déclarée et une
  interrogation sans masque doivent se comporter **exactement comme aujourd'hui**.
  Le moteur a des hôtes qui ne connaissent pas encore les couches.
- **Le broad phase doit en profiter** : un sous-arbre dont aucune couche ne croise
  le masque s'élague **sans descendre**. C'est l'occasion de gagner du temps, pas
  seulement de la justesse — l'enveloppe agrégée pourrait porter l'union des
  couches de son sous-arbre.
- `exclude:` **reste** pour ce qu'il fait bien (s'exclure soi-même, une exception
  ponctuelle) ; il cesse d'être le moyen d'exprimer une appartenance.

## Firewalls / risques

1. **Ne pas régresser la campagne du fuyard** (0 traversée sur 36) ni le taux de
   tunneling de `sweep()` (0 %) : ce sont les deux repères de justesse des
   collisions.
2. **Symétrie** : si A ignore B, B ignore-t-il A ? Un masque est **asymétrique**
   par nature (un tir voit un mur, un mur n'interroge personne) — mais la
   réconciliation émet des events **des deux côtés**. Il faut décider ce que voit
   le côté passif, et l'écrire ; le payload est déjà asymétrique par ailleurs
   (`2026-07-30_18-49`).
3. **Ne pas payer le filtre en narrow phase** : filtrer tard, c'est avoir déjà
   descendu l'arbre. Le gain est au broad phase ou il n'est pas.
4. **Une couche portée par la zone doit rester déclarative** : les descripteurs de
   sprites (`static descriptor`) déclarent déjà leurs zones — les couches s'y
   ajoutent, sans nouveau chemin de configuration.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-08**, `080-done` compris.
- `src/engine/scene/CollisionSystem.js` — zones, broad + narrow phase,
  réconciliation.
- `src/engine/scene/WorldQuery.js` — `exclude`, `type`, le contournement actuel.
- `src/engine/scene/SpriteElement.js` — où se déclarent les zones.
- `meta/documentation/engine.md` §6.
- Voisin : `2026-07-30_18-49` (asymétrie du payload de collision).

## Definition of Done

- [ ] Une zone déclare sa couche ; une interrogation déclare son masque ; les
      deux ont un défaut qui **reproduit le comportement actuel**.
- [ ] Le broad phase élague sur le masque — mesure du gain à ~3 000 éléments.
- [ ] Le projectile de la démo n'utilise plus `exclude` pour dire « je ne touche
      pas mon camp ».
- [ ] Campagne du fuyard : 0 traversée sur 36 ; sweep : 0 % de tunneling.
- [ ] Le sort du côté passif (events, payload) est écrit.
- [ ] `engine.md` §6 à jour, `npm run verify` vert.

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
