---
id: 2026-08-03_16-29
title: Un élément détruit garde un pointeur vers son ex-parent
type: fix
branch:
created: 2026-08-03 16:29
ready:
doing:
verify:
done:
---

## Objectif

Après `child.destroy()`, le parent ne liste plus l'enfant (`getChildren()` est
vide) mais **`child.getParent()` renvoie toujours le parent** :
`SceneGraph.reset()` ne vide que le lien **descendant**.

Trouvé en écrivant les tests de `2026-08-03_09-32` — le test qui l'affirmait a
échoué, et c'est l'assertion qui a été corrigée, la trouvaille étant hors
périmètre.

Conséquence : un nœud mort **répond encore**. `offsetX()` / `offsetY()` remontent
une chaîne de parents fantôme et rendent une position **plausible** ; `getBoard()`
résout toujours. Avec des projectiles qui meurent en vol et des abonnés qui les
tiennent une frame de trop, c'est le genre de valeur fausse qu'on cherche
longtemps. Accessoirement, la chaîne remontante n'est pas collectable.

### Ce n'est plus latent : la ceinture anti-fuite des FX est déjà défaite

Trouvé par la passe d'audit A du 2026-08-06. `Emitter.isAlive()` promet qu'« un
emitter lié à un élément meurt avec lui, quel que soit le chemin qui l'a
détruit ». Il reconnaît un orphelin à `getParent() === null` — précisément ce que
`destroy()` **ne fait pas**. Mesuré :

| | |
|---|---|
| salves avant `destroy()` | 1 |
| salves après deux frames de plus | **3** — il émet toujours |
| `target.getParent()` après `destroy()` | **non nul** |
| `isAlive()` | **true** |
| une fois le lien remontant coupé à la main | `isAlive: false`, l'emitter s'arrête |

Autrement dit : la seconde des deux ceintures posées contre les emitters qui
survivent à leur élément (`2026-07-26_14-18`) **ne tient pas**, et ce ticket en
est la cause. Ce qui la sauve aujourd'hui, c'est que `Board.freeArea` passe par
un autre chemin (l'event `element.destroy`, auquel le `FxBinder` s'abonne) — donc
le cas couvert marche, et c'est le cas **non couvert** qui fuit : un
`board.despawn()` d'entité, exactement ce que les projectiles vont faire.

## Spécifications

_À confirmer en « specify »._ Deux issues, et il faut **choisir**, pas subir :

- **Couper le lien remontant** dans `destroy()`, et décider ce que répondent
  alors `getParent()` (null), `offsetX()`/`offsetY()` (position locale ? dernière
  position monde connue ?) et `getBoard()`.
- **Assumer** : « un élément détruit reste lisible » est un contrat défendable —
  à condition d'être écrit et testé, pas hérité par accident.

## Firewalls / risques

1. **Des abonnés lisent l'élément pendant `element.destroy`** — le `FxBinder`
   parcourt son sous-arbre. L'event est émis **avant** le nettoyage, donc avant
   toute coupure ; vérifier que l'ordre reste bon.
2. **`offsetX()` sans parent** ne doit pas jeter : le catalogue construit des
   éléments détachés et lit leur géométrie.

## Contexte / liens

- Origine : candidat déposé à la clôture de `2026-08-03_09-32`, trié le 2026-08-03.
- `src/engine/scene/Element.js` — `destroy()`.
- `src/engine/scene/SceneGraph.js` — `reset()`, `setParent()`, `offsetX()`.
- `test/Element.destroy.test.js` — le test dont l'assertion a été rabaissée, à
  remonter une fois le contrat choisi.

## Definition of Done

- [ ] Le contrat est **écrit** (JSDoc + `engine.md`) et **testé** : ce que rend
      un élément détruit, sur `getParent`, `offsetX/Y` et `getBoard`.
- [ ] `test/Element.destroy.test.js` porte l'assertion complète, plus la note
      provisoire.
- [ ] Un élément détaché (jamais attaché) et un élément détruit répondent la
      **même** chose — pas deux régimes.
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
