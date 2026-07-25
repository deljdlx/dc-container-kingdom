---
id: 2026-07-25_14-43
title: Ajouter les sprites de personnages manquants
type: feat
branch: feat/missing-character-bases
created: 2026-07-25 14:43
ready: 2026-07-25 14:46
doing: 2026-07-25 14:46
verify: 2026-07-25 14:53
done: 2026-07-25 14:56
---

## Objectif

Completer les bases de personnages disponibles dans le moteur afin d'augmenter
la variete visuelle des PNJ de la demo et de Container Kingdom. Aujourd'hui,
la feuille `characters-00.png` contient 8 bases exploitables, mais seules 4
sont exposees: `Man00`, `Woman00`, `Woman01`, `Woman02`.

## Spécifications

- Ajouter les 4 bases manquantes de `characters-00.png` dans
  `src/engine/map/Elements/CharacterBases/`, avec leurs offsets exacts dans la
  sprite-sheet partagée de 48 px.
- Exporter ces nouvelles bases via `src/engine/index.js` pour conserver la
  frontiere app -> moteur.
- Verifier que chaque base rend correctement les frames de marche dans le
  moteur.
- Rendre ces nouvelles bases disponibles dans le catalogue moteur et
  reutilisables par l'application.
- Etendre la demo moteur et la generation de PNJ de Container Kingdom pour
  utiliser l'ensemble des bases disponibles plutot qu'un sous-ensemble de 4.
- Couvrir les nouvelles bases par des tests cibles sur les exports / offsets et
  mettre a jour la documentation impactee par l'API publique.

## Contexte / liens

- `src/engine/map/Elements/CharacterBases/`
- `src/engine/index.js`
- `src/engine/catalog/`
- `src/container-kingdom/js/ContainerKingdomRenderer.js`
- `meta/documentation/engine.md`
- `meta/agents/engine-boundary.md`

## Definition of Done

- [x] Les 4 classes de personnages manquantes de `characters-00.png` sont
  ajoutees avec les bons offsets.
- [x] Les 8 bases disponibles sur cette sprite-sheet sont exportees par l'API
  publique du moteur et reutilisables dans l'app.
- [x] La demo moteur, le catalogue et Container Kingdom utilisent bien ce pool
  et rendent les nouveaux personnages sans regressions visuelles.
- [x] `npm run verify` passe sans regression.

## Journal

### Travail

- [2026-07-25 14:46] Ticket specifie puis pris en charge sur la branche
  `feat/missing-character-bases` ; portee fixee aux 4 bases non exposees de
  `characters-00.png` et a leur integration dans le moteur, la demo et l'app.
- [2026-07-25 15:02] Correction de nomenclature : `Woman03` correspond en fait a
  un sprite masculin sur la feuille partagee, renomme en `Man04` dans l'API
  publique, les usages de l'app, la demo, les tests et la doc.

### Vérification

- [2026-07-25 14:53] `npm run verify` passe apres renommage de `Woman03` en
  `Man04` ; lint, build et 123 tests OK.

### Validation

- [2026-07-25 14:53] Catalogue moteur recharge et aligne avec l'API publique :
  `Man04` est present dans `dist` et dans la page `/engine/catalog/`, sans
  occurrence residuelle de `Woman03` hors journal de ticket.
- [2026-07-25 14:53] Acceptation fonctionnelle OK au regard de l'objectif et de
  la DoD. Le ticket reste en `060-verify` tant que la branche n'est pas committe
  puis mergee sur `main`, conformement au workflow.
- [2026-07-25 14:56] Branche `feat/missing-character-bases` mergee sur `main`
  via `0cf79ce` (`merge: integre les sprites de personnages manquants`). Ticket
  deplace en `080-done`.