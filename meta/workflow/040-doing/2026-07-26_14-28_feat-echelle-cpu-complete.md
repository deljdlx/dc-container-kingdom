---
id: 2026-07-26_14-28
title: Indicateur CPU — échelle incomplète (invisible entre 5 % et 80 %)
type: feat
branch: copilot/feat-echelle-cpu-complete
created: 2026-07-26 14:28
ready: 2026-07-27 17:30
doing: 2026-07-27 17:30
verify:
done:
---

## Objectif

`Container.CPU_USAGE_THRESHOLDS` définit **dix** paliers (`xxs`, `xs`, `s`, `m`,
`xm`, `xxm`, `l`, `xl`, `xxl`, `xxxl`) + `critical`, et `ContainerView` les pousse
dans `dataset.cpuUsage`. Mais `infra-viewer.css` ne stylise que **`xxs`, `xs` et
`critical`** : un conteneur entre ~5 % et ~80 % de CPU affiche un `.cpu-indicator`
transparent — donc **rien**. L'information CPU, qui est l'un des intérêts de la
visualisation, est invisible sur toute la plage utile.

Symétriquement, `memory.css` couvre `xxs`…`xxm`, `l`, `xl` mais pas `xxl` /
`xxxl` : les plus gros conteneurs retombent sur le style de base.

## Spécifications

### Fonctionnel

- Chaque palier CPU a un rendu **distinguable** et progressif (taille / couleur /
  vitesse d'animation), lisible d'un coup d'œil sur la carte.
- Même complétude pour les paliers mémoire manquants.
- Rester dans l'esprit visuel actuel (indicateur en orbite, palette existante) —
  finition « produit », pas de refonte.

### Technique

- Générer la progression plutôt que d'empiler 11 blocs quasi identiques : variables
  CSS par palier (`--cpu-scale`, `--cpu-color`, `--cpu-speed`) posées par un unique
  jeu de sélecteurs `[data-cpu-usage="…"]`, le reste hérité.
- Attention aux animations : 11 animations `orbit` concurrentes sur beaucoup de
  conteneurs coûtent cher — mutualiser une seule `@keyframes` paramétrée par
  variables, et vérifier le coût GPU.
- Respecter `prefers-reduced-motion` (accessibilité, animations permanentes).

## Contexte / liens

- `src/container-kingdom/css/infra-viewer.css` (`[data-cpu-usage]`,
  `.cpu-indicator`, `@keyframes orbit`)
- `src/container-kingdom/css/containers/memory.css` (`memory--*`)
- `src/container-kingdom/js/Container.js` (`CPU_USAGE_THRESHOLDS`,
  `getCpuUsageThreshold`)
- `src/container-kingdom/js/ContainerKingdomRenderer.js`
  (`MEMORY_USAGE_THRESHOLDS`)

## Definition of Done

- [ ] Les 11 paliers CPU et tous les paliers mémoire ont un rendu visible et
      ordonné (croissance monotone perçue).
- [ ] Une seule `@keyframes` mutualisée, paramétrée ; `prefers-reduced-motion`
      respecté.
- [ ] Validation navigateur sur un jeu de fixtures couvrant plusieurs paliers
      (ajuster `mock/fixtures/containers.json` si besoin).
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
