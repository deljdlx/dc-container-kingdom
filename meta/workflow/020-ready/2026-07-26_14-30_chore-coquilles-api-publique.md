---
id: 2026-07-26_14-30
title: Corriger les coquilles de l'API publique (Posision, Bouding, drawHVertical)
type: chore
branch:
created: 2026-07-26 14:30
ready: 2026-07-27 17:07
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

### Décision : renommage sec, sans alias déprécié

Arbitrage tranché en *specify*, sur relevé plutôt qu'au jugé. Les trois noms
totalisent **11 occurrences dans 5 fichiers**, toutes **dans ce dépôt** :

| Nom fautif | Occurrences | Fichiers |
|---|---|---|
| `freeAreasFromCurrentPosision` | 4 | `Viewport.js` (déclaration + 1 appel), `test/Viewport.test.js` (2) |
| `updateBoudingBox` | 5 | `Element.js` (3), `CollisionSystem.js` (2) |
| `drawHVerticalRoads` | 2 | `ContainerKingdomRenderer.js` (déclaration + 1 appel) |

Aucun consommateur hors dépôt, aucune publication npm, aucune occurrence dans la
doc (`meta/documentation/`, `src/engine/README.md`) ni dans la démo ou le
catalogue. Un alias déprécié n'aurait donc **personne à protéger** : il ajouterait
un second nom à maintenir et à retirer plus tard. **Renommage sec.**

### Technique

- Renommer, et mettre à jour **tous** les appels (moteur, app, tests) ainsi que
  les JSDoc concernées.
- `src/engine/index.js` n'est **pas** touché : ce sont des méthodes, pas des
  classes exportées — le baril public est inchangé.
- Attention aux appels **croisés** : `Element.updateBoudingBox()` délègue à
  `CollisionSystem.updateBoudingBox()`, qui rappelle le parent. Les deux se
  renomment ensemble ou la chaîne casse.
- `test/Viewport.test.js` référence le nom fautif dont une fois **en chaîne de
  caractères** (`vi.spyOn(viewport, 'freeAreasFromCurrentPosision')`) : un
  renommage qui l'oublierait laisserait le spy passer à côté sans faire échouer
  le test de façon évidente.
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

- [ ] Les trois noms sont corrigés, aucun appel résiduel (`grep` à l'appui, y
      compris le nom passé en **chaîne** au `vi.spyOn` de `test/Viewport.test.js`).
- [ ] Doc et JSDoc à jour ; décision sur l'alias déprécié tracée dans le ticket.
- [ ] Aucun changement de comportement : renommage pur, la suite de tests passe
      **sans être modifiée** ailleurs que sur les noms.
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
