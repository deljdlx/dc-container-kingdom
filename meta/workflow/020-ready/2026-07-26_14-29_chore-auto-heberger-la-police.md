---
id: 2026-07-26_14-29
title: Auto-héberger la police Changa (perf + hors-ligne)
type: chore
branch:
created: 2026-07-26 14:29
ready: 2026-07-27 17:05
doing:
verify:
done:
---

## Objectif

`src/index.html` charge la police **Changa** depuis `fonts.googleapis.com` (plus
deux `preconnect`). Pour un tableau de bord Docker **local**, c'est trois défauts
d'un coup :

- **hors-ligne / réseau restreint** : la police ne charge pas, le rendu retombe sur
  la police système — l'app dépend d'un tiers pour s'afficher correctement ;
- **perf** : une feuille de style tierce bloquante avant le premier rendu, sur un
  produit dont on soigne le poids ;
- **vie privée** : chaque ouverture de l'app fait une requête à Google.

## Spécifications

### Technique

- Embarquer les fichiers de police (woff2) dans le dépôt, avec `@font-face` local
  et `font-display: swap`.
- **Ne prendre que les graisses réellement utilisées** — l'import actuel demande
  200 à 800 ; auditer le CSS avant de tout embarquer.
- Décider où : la police relève de l'**app**, pas du moteur — donc côté
  `src/container-kingdom/` (le moteur reste agnostique, cf.
  `meta/agents/engine-boundary.md`). Vérifier ce que fait la démo / le catalogue.
- Vérifier la résolution des chemins par le build Vite (`root: 'src'`,
  `publicDir: false`).
- Mentionner la licence de la police (OFL) là où le dépôt liste ses assets.

## Contexte / liens

- `src/index.html` (`preconnect` + `<link>` Google Fonts)
- `src/engine/css/_variables.css`, `src/container-kingdom/css/layout.css`
  (usages de la famille)
- `vite.config.js` (entrées HTML, `publicDir: false`)
- `src/engine/demo/index.html`, `src/engine/catalog/index.html` (mêmes imports ?)

## Definition of Done

- [ ] Plus aucune requête vers un domaine externe au chargement de l'app
      (vérifié dans l'onglet réseau).
- [ ] Police correctement appliquée en dev **et** dans le build (`npm run build` +
      `npm run preview`).
- [ ] Seules les graisses utilisées sont embarquées ; licence mentionnée.
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
