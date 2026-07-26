---
id: 2026-07-26_14-30
title: Corriger les coquilles de l'API publique (Posision, Bouding, drawHVertical)
type: chore
branch:
created: 2026-07-26 14:30
ready:
doing:
verify:
done:
---

## Objectif

Trois noms fautifs sont exposés dans l'API publique et se propagent à chaque
nouvel appel :

- `Viewport.freeAreasFromCurrentPosision()` → **Position**
- `Element.updateBoudingBox()` / `CollisionSystem.updateBoudingBox()` →
  **Bounding**
- `ContainerKingdomRenderer.drawHVerticalRoads()` → le `H` est un reste de
  copier-coller de `drawHorizontalRoads`

Le moteur se veut réutilisable : ses noms publics sont son contrat, et une
coquille dans un nom coûte plus tard qu'aujourd'hui.

## Spécifications

### Technique

- Renommer, et mettre à jour **tous** les appels (moteur, app, démo, catalogue,
  tests) ainsi que la doc et les JSDoc concernées.
- Pour les deux méthodes **du moteur** : décider en *specify* si l'on garde un
  alias déprécié le temps d'une version. Le seul consommateur connu est ce dépôt →
  un renommage sec est probablement suffisant ; le noter dans la doc.
- Passer un `grep` final sur les anciens noms pour garantir qu'il n'en reste rien.

## Contexte / liens

- `src/engine/map/Viewport.js`, `src/engine/map/Element.js`,
  `src/engine/map/CollisionSystem.js`
- `src/container-kingdom/js/ContainerKingdomRenderer.js`
- `src/engine/index.js` (baril public), `meta/documentation/engine.md`,
  `src/engine/README.md`
- **Parallèle-safe** : à faire seul (touche plusieurs fichiers du moteur) — éviter
  de le mener en même temps que les tickets moteur voisins.

## Definition of Done

- [ ] Les trois noms sont corrigés, aucun appel résiduel (`grep` à l'appui).
- [ ] Doc et JSDoc à jour ; décision sur l'alias déprécié tracée dans le ticket.
- [ ] `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
