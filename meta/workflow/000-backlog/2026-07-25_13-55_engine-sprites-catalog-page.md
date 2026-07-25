---
id: 2026-07-25_13-55
title: Créer une page de visualisation des sprites moteur
type: feat
branch:
created: 2026-07-25 13:55
ready:
doing:
verify:
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

-

### Vérification

-

### Validation

-
