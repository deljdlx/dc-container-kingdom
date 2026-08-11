---
id: 2026-08-06_17-56
title: Écrire la règle DOM / canvas — vivant et persistant contre temporaire
type: docs
branch: claude/dom-vs-canvas-rule
created: 2026-08-06 17:56
ready: 2026-08-11 09:30
doing: 2026-08-11 08:30
verify:
done:
---

## Objectif

Décision d'architecture énoncée le 2026-08-06 : **le DOM porte les entités
vivantes et/ou persistantes ; tout ce qui est temporaire par conception passe par
le canvas.**

Elle n'est écrite **nulle part**. Et l'absence coûte déjà : le projectile de la
démo (`2026-08-04_18-32`) a été construit en **DOM** — un `Element` sur la couche
d'entités avec une classe CSS — parce que rien ne disait le contraire. C'est
aujourd'hui l'exemple que quiconque copiera.

Une règle de routage pareille décide de **chaque** ajout futur : projectile,
explosion, décalque, étincelle, texte flottant. La laisser implicite, c'est la
faire re-trancher à chaque fois, différemment.

## Spécifications

Le firewall n° 1 est levé : `2026-08-06_17-57` a livré la surface et ses
peintres, et le projectile de la démo est **déjà** passé au canvas. La règle
n'est donc plus un vœu — elle décrit ce que le moteur fait.

- **La règle et son critère** : ce qui départage n'est ni la taille ni le nombre,
  c'est la **durée de vie voulue**. Une entité que le joueur peut retrouver,
  ramasser, tuer → DOM. Une chose dont l'existence est un instant du rendu →
  canvas.
- **Ce que chaque côté donne** : le DOM apporte le hit-testing, le CSS, les
  events, l'inspection ; il coûte 3 nœuds et du layout. Le canvas ne coûte que du
  dessin, mais ne sait rien de la scène.
- **Le chiffre qui la justifie** — mesuré par la passe d'audit B :
  le layout du navigateur franchit le budget d'une frame vers **1 000 éléments**
  DOM. La règle est précisément ce qui garde ce budget pour ce qui compte.
- **Où l'écrire** : `meta/documentation/engine.md` (la section rendu et §2.1), et
  `meta/agents/engine-boundary.md` avec ses trois points d'entrée — c'est une
  règle d'architecture, donc une règle agent.

## Firewalls / risques

1. **Ne pas énoncer une règle que le moteur ne peut pas tenir** : aujourd'hui rien
   ne sait dessiner autre chose que des particules sur le canvas
   (`2026-08-06_17-57`). L'écrire sans l'outiller, c'est écrire un vœu.
2. **La couche d'entités reste justifiée** : elle sert le persistant sans tuile
   (butin au sol, un puits qui survit à son area). La règle la précise, elle ne
   la remet pas en cause.
3. **Ne pas transformer la règle en interdit** : un hôte peut avoir de bonnes
   raisons de faire autrement, la règle est un défaut, pas une police.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-06**, `080-done` compris.
- Le chiffre : candidat `2026-08-06_17-21` (plafond du rendu DOM).
- L'outillage qui manque : `2026-08-06_17-57`.
- Le contre-exemple à corriger : le projectile de `src/engine/demo/demo.js`.
- `meta/documentation/engine.md` §2.1 (couche d'entités), §3.2 (fx).

## Definition of Done

- [ ] La règle est écrite dans `engine.md`, avec **son critère** (durée de vie
      voulue) et **son chiffre** (le plafond mesuré).
- [ ] `meta/agents/engine-boundary.md` la porte, et les **trois points d'entrée**
      restent identiques entre eux (le test du board le vérifie).
- [ ] La couche d'entités est **re-décrite** à sa juste place : le persistant sans
      tuile, pas le temporaire.
- [ ] `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
