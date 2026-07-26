---
id: 2026-07-26_19-11
title: updateWithRelativeElement grossit la mauvaise boîte
type: refactor
branch:
created: 2026-07-26 19:11
ready: 2026-07-26 19:25
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

### Fonctionnel

- La méthode grossit **le receveur**, et lui seul : aucun effet de bord sur une
  autre boîte.
- Un enfant dont l'agrégat de collision est **indéfini** (aucune zone, aucun
  enfant) ne contribue rien — comportement actuel, déjà couvert par un test, à
  conserver.
- Le chemin incrémental est **inchangé** : le receveur y est déjà la boîte du
  parent, donc le résultat est identique avant / après.

### Technique

- Signature : `updateWithRelativeElement(childElement)` — le paramètre
  `parentElement` disparaît (il ne servait qu'à retrouver la boîte à modifier).
- Implémentation : sortir si `childElement.getCollisionBoundingBox().isUndefined()`
  — le helper existe déjà —, sinon projeter la boîte de l'enfant par
  `childElement.x()` / `.y()` et **déléguer à `updateWithBoundingBox`**, de sorte
  qu'il ne reste qu'un seul chemin de croissance.
- **Aucune arithmétique sur `null`** : c'est le piège déjà rencontré dans
  `2026-07-26_18-55` (`null + 100 === 100`, d'où des bords fantômes). Le garde
  `isUndefined()` traite toute boîte partiellement définie comme absente, ce qui
  est désormais cohérent — depuis ce même ticket, les agrégats sont soit vides,
  soit complets.
- Retirer de `recomputeAggregates` l'installation anticipée de la boîte **et** le
  commentaire qui documente le piège : il n'y a plus de piège.
- Mettre à jour les **deux** appels (`CollisionSystem:116` et `:167`), la JSDoc, et
  les **deux** tests existants de `test/BoundingBox.test.js` — leurs assertions ne
  changent pas, seul l'appel se simplifie (ils montaient justement un stub où le
  receveur et la boîte du parent étaient le même objet, ce qui masquait le défaut).

### Risques / vigilance

- `BoundingBox` est exporté par le baril `src/engine/index.js` : c'est un
  changement d'**API publique** du moteur. Vérifié : aucune doc ne cite la
  signature, et il n'existe pas d'autre appelant que les deux ci-dessus (`grep`).
- Ne pas affaiblir les tests existants : les assertions doivent rester les mêmes.

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
