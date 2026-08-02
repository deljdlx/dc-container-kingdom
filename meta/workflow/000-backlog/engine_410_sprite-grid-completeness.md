---
id: 2026-07-26_00-48
title: Vérifier la complétude des grilles de sprites
type: test
branch:
created: 2026-07-26 00:48
ready:
doing:
verify:
done:
---

## Objectif

Vérifier qu'aucune grille / famille de sprites exploitable des atlas de carte
n'est oubliée dans le catalogue moteur, et identifier précisément les sprites
(ou groupes) manquants avant d'ouvrir, si nécessaire, les tickets
d'implémentation.

## Spécifications

### Fonctionnel

- Auditer les atlas de carte déjà utilisés par le moteur pour comparer:
  1) ce qui existe sur l'atlas source,
  2) ce qui est déjà exposé comme classes publiques,
  3) ce qui apparaît dans `/engine/catalog/`.
- Produire une liste des manques classés par planche/famille (avec un niveau de
  confiance: sûr / ambigu à trier).
- Créer immédiatement les tickets de réalisation pour les manques jugés sûrs et
  suffisamment découpables à l'issue de l'état des lieux.
- Distinguer clairement:
  - les sprites autonomes (candidats directs à l'exposition),
  - les fragments d'assemblage (autotiles, bords/coins, routes modulaires,
    façades/toitures en morceaux, etc.) qui ne doivent pas être exposés tels quels.

### Technique

- S'appuyer sur l'API publique exportée via `src/engine/index.js` et
  l'inventaire `src/engine/catalog/`.
- Croiser avec les modules existants sous `src/engine/content/` et les
  atlas de carte sous `src/engine/images/map/`.
- Ajouter au moins un test de caractérisation/documentation exécutable si utile
  pour figer le constat (ex: présence/absence attendue de certaines familles).
- Ouvrir ensuite (dans le board) un ou plusieurs tickets de réalisation ciblés,
  plutôt qu'un ticket géant, pour les familles retenues comme manquantes.

### Risques / vigilance

- Éviter les faux positifs: certains sprites sont volontairement exclus car non
  autonomes ou trop ambigus visuellement.
- Ne pas modifier le rendu du moteur dans ce ticket d'audit, sauf ajustement
  minimal nécessaire à la vérification.

## Contexte / liens

- Catalogue: `src/engine/catalog/`
- Exports publics moteur: `src/engine/index.js`
- Éléments carte: `src/engine/content/`
- Atlas carte: `src/engine/images/map/`
- Docs: `meta/documentation/engine.md`
- Recette liée: `meta/recipes/add-map-element.md`

## Definition of Done

- [ ] Un état des lieux des familles/grilles manquantes est documenté (par atlas,
      avec statut sûr/ambigu).
- [ ] Les exclusions légitimes (fragments d'assemblage) sont explicitement
      notées.
- [ ] Les suites de travaux nécessaires sont découpées en tickets actionnables.
- [ ] Les éventuels tests ajoutés passent et `npm run verify` est vert.

## Journal

### Travail

- [2026-07-26 00:48] Ticket créé pour cadrer l'audit de complétude des grilles de sprites.
- [2026-07-26 00:49] Périmètre resserré aux atlas de carte, avec état des lieux attendu et création immédiate des tickets de suite si des manques sûrs sont confirmés.

### Vérification

-

### Validation

-
