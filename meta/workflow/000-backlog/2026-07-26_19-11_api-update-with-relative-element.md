---
id: 2026-07-26_19-11
title: updateWithRelativeElement grossit la mauvaise boîte
type: refactor
branch:
created: 2026-07-26 19:11
ready:
doing:
verify:
done:
---

## Objectif

`BoundingBox.updateWithRelativeElement(parentElement, childElement)` ne modifie
**pas la boîte sur laquelle on l'appelle** : elle grossit celle qu'elle atteint via
`parentElement.getCollisionBoundingBox()`.

Sur le chemin incrémental les deux sont le même objet, donc le piège est
invisible. Dans `CollisionSystem.recomputeAggregates()`, en revanche, la boucle sur
les enfants mutait l'**ancienne** boîte — aussitôt remplacée par la nouvelle : les
enfants n'étaient donc **jamais** repliés dans l'enveloppe recalculée. Bug réel,
trouvé par la mesure pendant le ticket `2026-07-26_18-55`, **contourné** (installer
la nouvelle boîte avant de replier les enfants) et **pas réparé**.

Une méthode dont le receveur n'est pas ce qu'elle modifie est un piège pour tout
appel futur : celui-ci a déjà coûté un bug silencieux, et le contournement ne tient
aujourd'hui que par un commentaire — c'est-à-dire par la vigilance du prochain
lecteur.

## Spécifications

_À compléter en « specify ». Direction : que la méthode grossisse **le receveur**
(`this`) à partir de la boîte de collision de l'enfant projetée par la position
locale de celui-ci. Le paramètre `parentElement` devient alors inutile — donc
changement de signature d'une classe **exportée** (`src/engine/index.js`) : mettre à
jour les deux appels (`updateCollisionBoundingBox`, `recomputeAggregates`), la JSDoc,
et retirer le contournement + son commentaire devenus sans objet._

## Contexte / liens

- `src/engine/map/BoundingBox.js` (`updateWithRelativeElement`)
- `src/engine/map/CollisionSystem.js` (`updateCollisionBoundingBox`,
  `recomputeAggregates` — le contournement à retirer)
- `src/engine/index.js` (baril public : `BoundingBox` y est exporté)
- `test/BoundingBox.test.js`, `test/CollisionAggregates.test.js`,
  `test/Board.streaming-areas.test.js`
- Ticket d'origine : `2026-07-26_18-55`
- `meta/documentation/engine.md` (broad phase : ce que borne l'agrégat)

## Definition of Done

- [ ] `updateWithRelativeElement` grossit **le receveur**, et rien d'autre : un test
      le prouve (une boîte détachée grossit, la boîte courante de l'élément **ne
      bouge pas**) et échoue avant le correctif.
- [ ] Le contournement de `recomputeAggregates` (installation anticipée de la boîte)
      et son commentaire sont **retirés** — plus rien à contourner.
- [ ] Les deux appels et la JSDoc sont à jour ; aucun paramètre mort ne subsiste.
- [ ] Aucune régression : les tests de collision existants passent **sans être
      affaiblis**.
- [ ] Vérification runtime sur `/engine/demo/?debug=1` : les boîtes agrégées
      collent toujours exactement aux zones (même contrôle que `2026-07-26_18-55`).
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
