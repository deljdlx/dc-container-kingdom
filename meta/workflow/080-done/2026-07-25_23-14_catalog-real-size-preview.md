---
id: 2026-07-25_23-14
title: Afficher les sprites du catalogue en taille reelle
type: fix
branch: copilot/catalog-real-size
created: 2026-07-25 23:14
ready: 2026-07-25 23:15
doing: 2026-07-25 23:15
verify: 2026-07-25 23:17
done: 2026-07-25 23:17
---

## Objectif

Supprimer le zoom applique aux apercus dans `/engine/catalog/` pour que chaque
sprite soit affiche en taille reelle (1:1 pixel), afin de permettre une lecture
fiable de l'art source et des proportions.

## Specifications

### Fonctionnel

- Chaque apercu de carte dans le catalogue doit afficher le sprite sans
  agrandissement logiciel.
- Les metadonnees de carte ne doivent plus annoncer un facteur de zoom.
- Le layout existant (cartes, grille, filtre, infos collision/trigger) doit
  rester fonctionnel.

### Technique

- Retirer la logique de zoom de preview dans `src/engine/catalog/catalog.js`.
- Conserver un cadre de preview avec padding et centrage, mais sans `transform:
  scale(...)` applique sur les elements.
- Ajouter un test de non-regression ciblant la logique de layout preview.

## Contexte / liens

- Page cible: `src/engine/catalog/index.html`
- Impl: `src/engine/catalog/catalog.js`, `src/engine/catalog/catalog.css`
- Workflow: `meta/agents/workflow.md`

## Definition of Done

- [x] Les sprites du catalogue sont affiches en taille reelle (pas de zoom).
- [x] Le texte de meta d'une carte n'affiche plus de facteur de zoom.
- [x] Test de non-regression ajoute/ajuste et vert.
- [x] `npm run verify` est vert.

## Journal

### Travail

- [2026-07-25 23:14] Ticket cree pour corriger l'affichage des previews du catalogue en taille reelle.
- [2026-07-25 23:15] Demarrage de l'implementation sur `copilot/catalog-real-size`.
- [2026-07-25 23:16] Suppression du zoom applicatif dans `src/engine/catalog/catalog.js` et extraction de la logique de layout preview dans `src/engine/catalog/preview-layout.js`.

### Verification

- [2026-07-25 23:17] Test cible `npm test -- test/catalog-preview-layout.test.js` vert (2/2).
- [2026-07-25 23:17] `npm run verify` vert (25 fichiers, 192 tests).

### Validation

- [2026-07-25 23:17] Validation navigateur sur `http://localhost:5175/engine/catalog/`: absence de `scale(...)` inline sur les previews et disparition du texte `shown at ...x`.
