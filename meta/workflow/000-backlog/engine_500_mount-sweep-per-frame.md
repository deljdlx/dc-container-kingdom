---
id: 2026-08-05_14-42
title: Le balayage de montage parcourt tout le board à chaque frame de marche
type: refactor
branch:
created: 2026-08-05 14:42
ready:
doing:
verify:
done:
---

## Objectif

`BoardRenderer.mountPending()` parcourt **toutes les areas et tous leurs
enfants** pour trouver ce qui n'est pas encore rendu (`isRendered()`). Depuis que
bouger salit le nœud (`2026-08-04_17-15`), le joueur salit la racine à chaque
pas : le board se repeint, et le balayage tourne **exactement une fois par frame**
de marche — mesuré le 2026-08-04.

C'est devenu le poste principal du parcours : 2,4 nœuds visités par frame, mais
un balayage complet derrière. **O(areas × enfants)** là où le travail réel est
**O(nouveaux nœuds)**.

Sur la démo (49 areas, ~300 éléments) le tout reste sous 0,34 ms par frame, donc
invisible aujourd'hui. Ça grandit avec la carte — et c'est le genre de coût qui se
découvre trop tard.

## Spécifications

_À confirmer en « specify »._

- Tenir une **liste des éléments en attente de montage**, remplie à l'attache
  (`SceneGraph.addChild`) et vidée au montage, plutôt que de balayer l'arbre.
- **Ou** mesurer sur une carte dense (Container Kingdom, 219 conteneurs) et
  décider que le balayage suffit — auquel cas l'écrire.

## Firewalls / risques

1. **Le montage doit rester idempotent** : `isRendered()` est aujourd'hui la
   garde. Une liste doit tolérer un élément détruit avant d'avoir été monté.
2. **`Board.clear()` et le streaming** ajoutent et retirent en masse : la liste
   ne doit pas fuir sur ces chemins.
3. **Mesurer avant/après**, sinon on remplace un coût connu par un coût supposé.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-05**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-04_17-15`, trié le 2026-08-05.
- `src/engine/render/BoardRenderer.js` — `mountPending`, `mountChildrenOf`.
- `src/engine/scene/SceneGraph.js` — `addChild`, où la liste se remplirait.

## Definition of Done

- [ ] Le montage ne parcourt plus l'arbre entier par frame — **mesure
      avant/après** des nœuds inspectés.
- [ ] Un élément attaché puis détruit avant montage ne casse rien (test).
- [ ] `Board.clear()` et le streaming ne laissent pas d'entrée orpheline (test).
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
