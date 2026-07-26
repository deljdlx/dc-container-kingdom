---
id: 2026-07-26_14-20
title: Rafraîchir la carte sans recharger la page
type: feat
branch:
created: 2026-07-26 14:20
ready:
doing:
verify:
done:
---

## Objectif

Quand la liste de conteneurs change, la seule réaction prévue est
`document.location.reload()` : on perd le zoom, le pan, la console, le panneau
ouvert, et on refait tout le rendu (maisons, routes, 100 fleurs, PNJ) — pour un
conteneur qui démarre. Le repository sait déjà **réconcilier** son état
(`loadContainers()` supprime les disparus, met à jour les existants, crée les
nouveaux) : le rendu doit suivre le même chemin **incrémental**.

## Spécifications

### Fonctionnel

- Un conteneur **nouveau** → sa maison + son PNJ apparaissent, sans toucher au
  reste de la carte.
- Un conteneur **disparu** → sa maison disparaît (le modèle appelle déjà
  `element.destroy()`), sa cellule est **libérée** dans le placement.
- Un **changement d'état** (`running`/`exited`…) → classes `state--*` et seuils
  mémoire mis à jour en place.
- Zoom, pan, console et panneau d'info **survivent** au rafraîchissement.

### Technique

- Dépend du ticket « checksum mort » : il fournit le point d'entrée de détection.
- `ContainerKingdomRenderer.drawHouse()` s'appuie sur un drapeau
  `container.rendered` posé à la main et `ContainerPlacement.occupy()` n'a pas de
  contrepartie « libérer » — il faut un chemin de **retrait** symétrique.
- Attention : `drawContainers()` est déclarée sans paramètre mais appelée avec
  `this.getContainers()` (argument mort), et `drawHouse()` retourne `undefined`
  quand `container.rendered` est vrai — ce qui casse `drawFences()` au second
  passage. Ces deux points sont couverts par le ticket « durcir le tracé ».
- Les routes réseau (`drawNetworks`) sont recalculées globalement : décider en
  *specify* si on les redessine entièrement (aire 0,0 nettoyée) ou de façon
  incrémentale. Le redessin complet des seules routes est probablement le bon
  compromis.

### Risques / vigilance

- Ne pas dupliquer les PNJ / maisons sur un conteneur déjà rendu.
- Un `ContainerView` retiré doit voir son `watch()` arrêté (déjà fait par le
  repository) — vérifier qu'aucun timer ne survit.

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdom.js` (`loop`, `init`)
- `src/container-kingdom/js/ContainerKingdomRenderer.js` (`drawContainers`,
  `drawHouse`, `drawNetworks`)
- `src/container-kingdom/js/ContainerPlacement.js` (`occupy`, bornes)
- `src/container-kingdom/js/ContainerRepository.js` (réconciliation)
- Docs : `meta/documentation/container-kingdom.md`

## Definition of Done

- [ ] Ajout / suppression / changement d'état d'un conteneur se reflètent **sans**
      `location.reload()`.
- [ ] Le placement libère la cellule d'un conteneur disparu (réutilisable).
- [ ] Zoom / pan / console préservés lors d'un rafraîchissement.
- [ ] Tests sur la logique de réconciliation du rendu (placement, drapeaux).
- [ ] Validation navigateur avec le mock (`mock/fixtures/containers.json` modifié
      à chaud si possible) — voir `meta/recipes/verify-in-browser.md`.
- [ ] Doc à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
