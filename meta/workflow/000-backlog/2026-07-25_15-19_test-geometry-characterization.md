---
id: 2026-07-25_15-19
title: Tests de caractérisation pour Geometry
type: test
branch:
created: 2026-07-25 15:19
ready:
doing:
verify:
done:
---

## Objectif

`src/engine/map/Geometry.js` n'a aucun test alors qu'il porte de la logique
géométrique réutilisée par le moteur. Ajouter des **tests de caractérisation**
(figer le comportement actuel) pour sécuriser les futurs refactors.

## Spécifications

- Nouveau fichier `test/Geometry.test.js` couvrant l'API publique de `Geometry`
  (cas nominaux + bords évidents), **sans modifier** `Geometry.js`.
- S'aligner sur le style des tests existants (Vitest, `test/*.test.js`).

## Contexte / liens

- `src/engine/map/Geometry.js` (sujet, lecture seule)
- `test/` (style des tests existants, ex. `test/Element.test.js`)
- **Parallèle-safe** : ne crée que `test/Geometry.test.js` — disjoint des autres
  tickets de test parallèle.

## Definition of Done

- [ ] `test/Geometry.test.js` ajouté, `Geometry.js` inchangé.
- [ ] `npm run verify` vert (nouveaux tests inclus).

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
