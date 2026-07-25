---
id: 2026-07-25_13-55
title: Créer une page de visualisation des sprites moteur
type: feat
branch: feat/engine-sprites-catalog-page
created: 2026-07-25 13:55
ready: 2026-07-25 14:00
doing: 2026-07-25 14:03
verify: 2026-07-25 14:30
done:
---

## Objectif

Créer une page dédiée pour **visualiser l'ensemble des sprites (elements)
disponibles** du moteur, afin de faciliter l'exploration visuelle, le QA graphique
et le travail de level/design.

## Spécifications

- Ajouter une page statique accessible en local (ex: sous `src/engine/`) qui
  affiche une galerie des éléments du moteur.
- Lister les éléments exportés par l'API publique moteur (pas d'accès direct hors
  frontière publique).
- Pour chaque élément :
  - nom lisible (nom de classe)
  - aperçu visuel dans une tuile uniforme
  - éventuellement dimensions/bounding box si disponible
- Prévoir une mise en page responsive simple (desktop + mobile).
- Ajouter un minimum d'aide d'usage (titre + courte description).
- Ne pas introduire de dépendance UI externe.

## Contexte / liens

- Frontière moteur/app : `meta/agents/engine-boundary.md`
- API publique moteur : `src/engine/index.js`
- Démo moteur existante : `src/engine/demo/`
- Documentation moteur : `meta/documentation/engine.md`

## Definition of Done

- [ ] Une page de catalogue des sprites est accessible et rend les éléments
      disponibles.
- [ ] Les sprites sont affichés depuis l'API publique (`src/engine/index.js`) sans
      casser la frontière moteur/app.
- [ ] La page est lisible sur petit écran et desktop.
- [ ] `npm run verify` passe sans régression.
- [ ] Doc/README mis à jour si nécessaire pour indiquer où trouver cette page.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …`, par étape.

### Travail

- [2026-07-25 14:03] Ticket passe de `020-ready` a `040-doing` sur la branche `feat/engine-sprites-catalog-page`.
- [2026-07-25 14:18] Creation d'une page statique `src/engine/catalog/` qui importe uniquement l'API publique moteur, detecte les elements visuels exportes et rend une galerie responsive avec apercus et metadonnees.
- [2026-07-25 14:18] Ajout d'un module `catalog-registry` testable pour filtrer et classer les elements publics catalogueables, plus mise a jour du `src/engine/README.md` avec l'URL de la nouvelle page.
- [2026-07-25 14:22] Correction du build Vite pour emettre aussi les pages HTML moteur `engine/demo/` et `engine/catalog/`, pas seulement l'application principale.

### Vérification

- [2026-07-25 14:24] `npx vitest run test/catalog-registry.test.js` passe pour valider le filtrage et le classement des elements publics du catalogue.
- [2026-07-25 14:25] `npm run verify` passe une premiere fois ; controle complementaire du build revele que la page catalogue n'etait pas encore emise dans `dist/`.
- [2026-07-25 14:28] Apres ajout des entrees HTML moteur dans `vite.config.js`, `npm run verify` repasse au vert avec emission de `dist/engine/catalog/index.html` et `dist/engine/demo/index.html`.
- [2026-07-25 14:30] Validation runtime legere via serveur Vite local : `GET /engine/catalog/` repond `200 OK` et sert bien le HTML attendu du catalogue.

### Validation

-
