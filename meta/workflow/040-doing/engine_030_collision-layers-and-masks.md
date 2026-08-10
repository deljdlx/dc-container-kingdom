---
id: 2026-08-08_17-57
title: Des couches de collision et des masques, pour que tout ne touche pas tout
type: feat
branch: claude/collision-layers
created: 2026-08-08 17:57
ready: 2026-08-10 16:05
doing: 2026-08-10 16:10
verify: 2026-08-10 16:40
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

### Des noms, pas des bits

Tranché : les couches sont des **chaînes** (`'wall'`, `'enemy'`, `'bullet'`), et
un masque est un **jeu de noms**. Un champ de bits serait plus rapide et
illisible ; le nombre de couches attendu se compte sur une main, et la lisibilité
au débogage vaut plus que des nanosecondes qu'aucune mesure ne réclame. Le jour
où une mesure les réclamera, la représentation changera derrière la même API.

### La zone porte son appartenance et ce qu'elle teste

Deux notions distinctes, sur la **zone** et non sur l'élément — un personnage a
un corps et un capteur de vue, qui ne s'interrogent pas pareil :

- **`layer`** — ce que la zone **est** (`'enemy'`). Défaut : `'default'`.
- **`mask`** — ce que la zone **peut toucher** (`['wall', 'enemy']`). Défaut :
  `null`, c'est-à-dire **tout** — donc le comportement actuel, à la lettre.

```js
bolt.createCollisionZone(0, 0, 8, 8, 'collision', { layer: 'bullet', mask: ['wall', 'enemy'] });
npc.createCollisionZone(6, 8, 20, 16, 'collision', { layer: 'enemy' });

board.query(rect, { mask: ['enemy'] });
board.sweep(from, to, size, { mask: ['wall', 'enemy'] });
```

Les descripteurs déclaratifs suivent : `collisionLayer` / `triggerLayer` à côté
de `collision` / `trigger`, sans nouveau chemin de configuration.

### Le gain est au broad phase, ou il n'est pas

Filtrer en narrow phase, c'est avoir déjà descendu l'arbre. L'enveloppe agrégée
porte donc en plus **l'union des couches de son sous-arbre**, entretenue par les
deux mêmes chemins qu'elle : croissance à l'ajout, recalcul au retrait. Un
sous-arbre dont aucune couche ne croise le masque est **sauté entier**.

Le coût de ce test n'existe que pour ceux qui s'en servent : avec `mask === null`
— tous les hôtes actuels — c'est une comparaison à `null`, rien de plus.

### La symétrie, tranchée

Un masque est **asymétrique** par nature : un tir voit un mur, un mur
n'interroge personne. La règle retenue est la plus simple à tenir et à
expliquer : **le masque du détecteur décide qu'il y a contact ou non**. Pas de
contact, pas d'events — ni d'un côté ni de l'autre. Quand il y a contact, les
deux côtés sont notifiés comme aujourd'hui.

Autrement dit, le masque ne change pas *qui* est prévenu, il change *ce qui
compte comme un contact*.

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

- [x] Une zone déclare sa couche ; une interrogation déclare son masque ; les
      deux ont un défaut qui **reproduit le comportement actuel**.
- [x] Le broad phase élague sur le masque — mesure du gain à ~3 000 éléments.
- [x] Le projectile de la démo n'utilise plus `exclude` pour dire « je ne touche
      pas mon camp ».
- [x] Campagne du fuyard : 0 traversée sur 36 ; sweep : 0 % de tunneling.
- [x] Le sort du côté passif (events, payload) est écrit.
- [x] `engine.md` §6 à jour, `npm run verify` vert.

## Suite

- **Renommer une zone après coup élargit l'union sans la resserrer.** Assumé et
  documenté (une union trop large élague moins, elle ne nie jamais un contact),
  mais c'est un cousin du ticket « muter une zone ne rafraîchit aucune
  enveloppe » (`2026-08-01_12-05`), qui gagnerait à traiter les deux d'un coup.
- **Les couches ne servent encore à personne d'autre que la démo.** C'est la
  tranche de combat (`2026-08-08_17-58`) qui dira si `layer` / `mask` sur la
  zone était la bonne granularité — c'est là qu'il y aura deux camps.
- Rien à déposer en `100-follow-up/`.

## Journal

### Travail

- [2026-08-10 16:10] Branche `claude/collision-layers`. `src/engine/scene/layers.js` :
  `DEFAULT_LAYER`, `toMask`, `maskAccepts`, `maskAcceptsAny`. Des **noms**, pas des
  bits — décidé en *specify*, et la représentation pourra changer derrière la
  même API le jour où une mesure le réclamera.
- [2026-08-10 16:15] La **zone** porte `layer` et `mask` (pas l'élément) : un
  personnage a un corps et un capteur de vue, qui ne s'interrogent pas pareil.
  Défauts : `'default'` et `null` (= tout), donc le comportement historique **à
  la lettre** — les 584 tests existants sont passés sans un changement.
- [2026-08-10 16:20] L'enveloppe agrégée porte en plus l'**union des couches du
  sous-arbre**, entretenue par les deux mêmes chemins qu'elle : `_addLayer` grimpe
  jusqu'à la racine à l'ajout, `recomputeCollisionAggregate` la reconstruit au
  retrait. C'est ce qui fait du masque un filtre de **broad phase** et pas un
  filtre tardif.
- [2026-08-10 16:25] Narrow phase **paire par paire** (masque de la zone qui
  détecte contre couche de la zone visée) plutôt qu'un masque unique par
  détecteur : l'union sert à élaguer, elle est volontairement plus grossière que
  la vérité.
- [2026-08-10 16:30] La démo : le corps du joueur est étiqueté `'player'`, et le
  projectile déclare `mask: ['default']` au lieu d'`exclude: [bolt, player]`. Une
  liste d'appartenance remplace une liste d'individus.

### Vérification

`npm run verify` vert : **69 fichiers, 594 tests** (10 nouveaux).

**Le gain du broad phase**, mesuré au navigateur sur une area peuplée de 3 000
corps (un dixième sur la couche `enemy`, le reste sur `scenery`), interrogation
de toute l'area, moyenne sur 60 passes :

| | temps | trouvés |
|---|---|---|
| sans masque | 4,162 ms | 3 074 |
| masque présent (`enemy`) | **1,305 ms** | 300 |
| masque absent (`loot`) | **0,002 ms** | 0 |

Même forme sur la détection par élément (300 passes) : 0,896 ms sans masque,
**0,0013 ms** quand le masque ne nomme rien de présent — le sous-arbre est sauté
sans être descendu.

**Non-régression**, les deux repères du moteur :

- **campagne du fuyard : 0 traversée sur 36 approches** (9 angles × 4 poussées,
  60 frames chacune, 746 frames passées au contact rapproché) ;
- **tunneling : 0 %** — cible de 14 px, projectile de 6 px, toutes les phases de
  départ essayées, à 20, 24 et 64 px par pas, avec et sans masque. Et 100 % de
  « ratés » avec un masque qui ne nomme rien de présent, ce qui est la réponse
  juste : ce n'est pas une cible.

**Le masque tient dans la démo** : un balayage posé sur le joueur lui-même
touche `sans masque` et `masque player`, et **ne touche pas** avec
`masque default` — c'est exactement ce qui a remplacé `exclude`.

Les trois hôtes (app, démo, catalogue) chargés sans erreur console.

### Validation

- Fusionné sur `main` en `--no-ff`.
