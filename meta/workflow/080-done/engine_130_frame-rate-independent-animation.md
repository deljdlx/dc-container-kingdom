---
id: 2026-07-27_17-23
title: Décorréler la cadence d'animation du taux de rafraîchissement
type: fix
branch: copilot/frame-rate-independent-animation
created: 2026-07-27 17:23
ready: 2026-07-27 21:10
doing: 2026-07-27 21:10
verify: 2026-07-27 21:14
done: 2026-07-27 21:18
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

aucune

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 21:14] Comparaison des approches: cadence pilotée par `dt` seule rejetée (elle peut continuer à avancer si le personnage n'avance pas), cadence pilotée par distance retenue (les pas suivent les pixels réellement parcourus).
- [2026-07-27 21:14] Refactor moteur: `CharacterAnimator` passe en accumulation de distance, `Character.update()` reçoit la distance parcourue, propagation sur le joueur (`Viewport.moveCharacter`) et les PNJ (`CharacterBehavior`, `PatrolBehavior`, `FleeBehavior`).
- [2026-07-27 21:14] Ajout de preuves automatisées: stabilité 60/120/240 Hz dans `CharacterAnimator` et stabilité PNJ à temps simulé égal dans `CharacterBehavior`.

### Vérification

- [2026-07-27 21:14] `npx vitest run test/Character.test.js test/CharacterBehavior.test.js test/PatrolBehavior.test.js test/FleeBehavior.test.js` vert.
- [2026-07-27 21:14] `npm run verify` vert.

### Validation

- Merge local sur `main` effectué: `9f37349599ad52106e9bb60512e7330815d7772b`. Ticket déplacé en `080-done`.
