---
id: 2026-07-26_14-24
title: Boucle de jeu arrêtable et teardown du viewport
type: feat
branch:
created: 2026-07-26 14:24
ready:
doing:
verify:
done:
---

## Objectif

Le moteur sait démarrer sa boucle mais **pas l'arrêter** :

- `Viewport.tick()` se ré-arme via `requestAnimationFrame` sans conserver l'id →
  aucun `cancelAnimationFrame` possible. Une fois `run()` appelé, la boucle tourne
  jusqu'à la fermeture de l'onglet.
- `run()` attache des listeners `keydown`/`keyup` sur `document.body` sans jamais
  les détacher : deux appels à `run()` (ou deux `Application`, cas de la page
  catalogue / d'un futur écran de menu) = **listeners dupliqués**.
- `Viewport.clear()` vide le rendu mais laisse la boucle et les listeners vivants.

C'est un manque d'API pour tout hôte qui veut monter/démonter le moteur — et un
prérequis à des tests d'intégration propres.

## Spécifications

### Technique

- `startLoop()` conserve l'id rAF ; ajouter `stopLoop()` (idempotent) qui annule
  la frame en vol.
- `run()` idempotent : ne branche les entrées qu'une fois, et conserve les
  références pour pouvoir les retirer.
- Ajouter un `destroy()` (ou étendre `clear()`) : arrêt de la boucle, retrait des
  listeners, purge du DOM et des behaviors enregistrés.
- Cohérence avec l'app : `ContainerKingdom.clear()` / `stopLoop()` existent déjà
  côté app — le moteur doit offrir l'équivalent pour que `clear()` soit complet.
- Exporter ce qu'il faut depuis `src/engine/index.js` (aucun nouveau fichier
  interne exposé directement).

## Contexte / liens

- `src/engine/view/Viewport.js` (`startLoop`, `tick`, `run`, `clear`)
- `src/engine/Application.js`
- `src/container-kingdom/js/ContainerKingdom.js` (`clear`, `stopLoop` — modèle)
- Docs : `meta/documentation/engine.md` (cycle de vie), `src/engine/README.md`

## Definition of Done

- [ ] `stopLoop()` arrête effectivement la boucle (aucun `update()` après appel).
- [ ] `run()` appelé deux fois ne double pas les entrées clavier.
- [ ] `destroy()`/`clear()` laisse le viewport sans timer, sans listener, sans DOM.
- [ ] Tests couvrant les trois points ci-dessus (rAF simulé).
- [ ] API publique documentée (JSDoc + `meta/documentation/engine.md`),
      `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
