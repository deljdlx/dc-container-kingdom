---
id: 2026-07-27_17-23
title: Décorréler la cadence d'animation du taux de rafraîchissement
type: fix
branch:
created: 2026-07-27 17:23
ready:
doing:
verify:
done:
---

## Objectif

Empêcher l'animation de marche d'accélérer sur les écrans 120/144/240 Hz en
rendant la cadence d'animation indépendante de la fréquence des frames.

## Spécifications

- `CharacterAnimator.advance()` ne doit plus dépendre du nombre d'appels par
  frame.
- Baser la cadence sur le temps (`dt`) ou la distance parcourue ; comparer les
  deux approches et retenir celle qui garde le ressenti « les pas suivent la
  marche ».
- Inclure les PNJ (même chemin d'appel via `Character.update()`/behaviors), pas
  seulement le personnage principal.
- Ajouter une preuve automatisée : à temps simulé égal, la cadence d'animation
  reste stable quel que soit le pas de frame.

## Contexte / liens

- Origine : ticket 2026-07-26_14-23 (déposé en follow-up)
- Cible probable : `src/engine/character/CharacterAnimator.js`
- Appels transitifs : `src/engine/map/Character.js`, behaviors PNJ

## Definition of Done

- [ ] La cadence d'animation ne varie plus avec la fréquence d'écran.
- [ ] Test de non-régression ajouté (60 vs 120/240 Hz simulés).
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
