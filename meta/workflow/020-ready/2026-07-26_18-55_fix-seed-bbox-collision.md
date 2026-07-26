---
id: 2026-07-26_18-55
title: Bbox de collision — le recalcul diverge du chemin incrémental
type: fix
branch:
created: 2026-07-26 18:55
ready: 2026-07-26 18:56
doing:
verify:
done:
---

## Objectif

`CollisionSystem` construit sa bbox de collision agrégée par **deux chemins qui ne
donnent pas le même résultat** :

- **incrémental** (`updateCollisionBoundingBox`) — la boîte part de la valeur créée
  dans le constructeur, avant que la géométrie ne soit posée : ses quatre coins
  sont `null`, donc elle ne contribue à rien. Le résultat est **l'union des zones
  de collision et des enfants** ;
- **recalcul** (`recomputeAggregates`, ajouté par le ticket `2026-07-26_14-18`) —
  la boîte part de `new BoundingBox(this._element)` **après** que la géométrie est
  posée, donc du **rectangle complet de l'élément**.

Mesuré sur un `Character` 48×48 portant une zone `(16, 24, 14, 12)` :

| Chemin | Bbox de collision agrégée |
|---|---|
| incrémental | `(16,24) → (30,36)` — l'union des zones |
| après un `removeChild` | `(0,0) → (48,48)` — le rectangle de l'élément |

Autrement dit : **un même état donne deux enveloppes différentes** selon que
l'élément a perdu un enfant ou non. Conséquences :

- **broad phase affaiblie** — l'enveloppe grossit (ici ×3,4 en surface) sans
  raison, donc `_detect` élague moins et descend dans des sous-arbres inutiles ;
- **overlay de debug faux** — `?debug=1` dessine cette boîte : elle ne représente
  plus les zones réelles ;
- **comportement dépendant de l'historique** — le pire des trois : le même objet
  se comporte différemment selon ce qui lui est arrivé avant.

La détection reste **correcte** (la narrow phase teste les vraies zones) : c'est un
défaut de cohérence et de performance, pas un faux positif de collision.

## Spécifications

### Fonctionnel

- Pour un même état (mêmes zones, mêmes enfants), la bbox de collision agrégée
  doit être **identique**, que l'élément soit passé par le recalcul ou non.
- La sémantique de référence est celle du chemin **incrémental** : l'enveloppe des
  **zones de collision et de trigger, plus celles des enfants** — et **pas** le
  rectangle de l'élément. C'est ce que la narrow phase teste réellement
  (`_hitZones` compare des zones, jamais le rectangle), donc l'enveloppe doit
  border exactement ces zones.

### Technique

- `CollisionSystem.recomputeAggregates()` doit partir d'une boîte **vide**
  (`new BoundingBox()` sans élément) pour `_collisionBoundingBox`, comme le fait
  le chemin incrémental.
- Ne **pas** toucher au seed de `_boundingBox` (bbox de rendu) : celle-ci part
  légitimement du rectangle de l'élément (`initBoundingBox`), et le recalcul est
  déjà cohérent avec ce choix.
- **Test existant à requalifier** : `test/Board.streaming-areas.test.js`
  (« shrinks aggregate bounding boxes after freeing a distant area ») affirme
  qu'après libération la bbox de collision du board vaut `(0,0) → (width, height)`
  — c'est-à-dire précisément le rectangle du board, donc le comportement fautif.
  L'attendu doit être **renforcé, pas affaibli** : vérifier que l'enveloppe se
  réduit à ce qui reste réellement (une aire voisine conservée), pas au rectangle
  du board.

### Risques / vigilance

- Une boîte « vide » (coins `null`) doit rester **inoffensive** pour
  `isCollided()` : vérifier qu'un élément sans zone ni enfant ne provoque ni
  exception, ni collision fantôme.
- Le `Board` est le cas limite : après libération de toutes ses aires, il n'a plus
  ni zone ni enfant. Fixer explicitement le comportement attendu par un test.

## Contexte / liens

- `src/engine/map/CollisionSystem.js` (`recomputeAggregates`, constructeur,
  `updateCollisionBoundingBox`, `_detect`, `_hitZones`)
- `src/engine/map/BoundingBox.js` (constructeur avec / sans élément, `isCollided`)
- `test/Board.streaming-areas.test.js` (attendu à requalifier)
- Origine : review du ticket `2026-07-26_14-18` (d'où vient `recomputeAggregates`)
- `meta/documentation/engine.md` (collisions : broad phase / narrow phase)

## Definition of Done

- [ ] Un test **prouve la convergence** : pour un même état, la bbox de collision
      est identique avec et sans passage par `recomputeAggregates` (il échoue avant
      le correctif — contre-épreuve à documenter).
- [ ] `recomputeAggregates` reproduit la sémantique incrémentale (zones + enfants,
      pas le rectangle de l'élément) ; `_boundingBox` inchangée.
- [ ] Le cas limite « ni zone ni enfant » est couvert : pas d'exception, pas de
      collision fantôme.
- [ ] L'attendu de `test/Board.streaming-areas.test.js` est **renforcé** (l'enveloppe
      se réduit à ce qui reste), pas affaibli ni supprimé.
- [ ] Vérification runtime sur `/engine/demo/?debug=1` : les boîtes de debug
      correspondent aux zones, avant comme après une libération d'aire.
- [ ] `meta/documentation/engine.md` dit ce que borne la bbox de collision.
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, voir la recipe
[ticket-follow-up](../agents/recipes/workflow/ticket-follow-up.md)) : ce que le ticket
**ouvre**, ce qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. Quelques lignes ; `aucune` est une réponse valable. À la
différence du `Journal`, qui date le passé, cette rubrique regarde l'avant._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
