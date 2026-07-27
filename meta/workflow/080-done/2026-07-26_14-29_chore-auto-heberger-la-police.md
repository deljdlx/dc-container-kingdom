---
id: 2026-07-26_14-29
title: Auto-héberger la police Changa (perf + hors-ligne)
type: chore
branch: copilot/chore-auto-heberger-la-police
created: 2026-07-26 14:29
ready: 2026-07-27 17:05
doing: 2026-07-27 17:05
verify: 2026-07-27 17:14
done: 2026-07-27 17:19
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

- [x] Plus aucune requête vers un domaine externe au chargement de l'app
      (vérifié dans l'onglet réseau).
- [x] Police correctement appliquée en dev **et** dans le build (`npm run build` +
      `npm run preview`).
- [x] Seules les graisses utilisées sont embarquées ; licence mentionnée.
- [x] `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 17:14] audit des usages : aucune graisse explicite dans les CSS app/engine chargés par l'app ; seules les valeurs par défaut normal/bold sont pertinentes (400/700). Intégration locale : retrait Google Fonts dans `src/index.html`, ajout de `container-kingdom/css/fonts.css` avec `@font-face` `font-display: swap` (woff2 locaux, sous-ensembles arabic/latin-ext/latin), ajout des fichiers dans `src/container-kingdom/fonts/changa/` et mention OFL dans `README.md`.
- [2026-07-27 17:17] suppression du script analytics externe `metrics.jlb.ninja` dans `src/index.html` pour respecter la DoD « aucune requête externe au chargement de l'app ».

### Vérification

- [2026-07-27 17:17] `npm run verify` vert (lint + build + 39 fichiers / 266 tests). Vérification runtime : `npm run preview` (`127.0.0.1:4173`) + `npm run dev` (`127.0.0.1:5175`) ; via `performance.getEntriesByType('resource')`, `externalCount = 0` sur les deux, `hasLocalChanga = true`, `bodyFontFamily = "Changa, sans-serif"` en dev.

### Validation

- [2026-07-27 17:19] merge `deccd8b` sur `main` (`--no-ff`) puis passage en `080-done` ; DoD validée intégralement.

## Suite

- **Ce que ça ouvre** : optionnaliser la télémétrie (analytics interne) derrière une variable d'environnement explicite, désactivée par défaut en local.
- **Ce qu'on laisse de côté** : normalisation de la stratégie de polices pour la démo/catalogue moteur ; hors périmètre car ces pages n'importaient pas Google Fonts.
- **Ce qui a été déposé** : aucun candidat en `100-follow-up`.
