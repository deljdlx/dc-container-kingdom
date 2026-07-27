---
id: 2026-07-26_14-20
title: Rafraîchir la carte sans recharger la page
type: feat
branch: claude/refresh-incremental
created: 2026-07-26 14:20
ready: 2026-07-27 15:42
doing: 2026-07-27 15:43
verify: 2026-07-27 16:04
done: 2026-07-27 16:07
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

### Technique — tranché en *specify*

- Dépend du ticket « checksum mort » : il fournit le point d'entrée de détection.
- **Le renderer tient son propre registre** `id → {x, y, house}`. Au moment où la
  réconciliation a lieu, le repository a **déjà** détruit l'élément du conteneur
  disparu et oublié le modèle : sans registre côté renderer, impossible de savoir
  quelle cellule libérer.
- **Routes redessinées en bloc**, pas en incrémental : leur tracé est une fonction
  globale de la topologie réseau (un conteneur qui part peut couper une route qui
  en traversait trois). Le renderer garde donc la liste des éléments de route et
  d'arbre pour les détruire avant de retracer.
- **Changement d'état** : mirroir par `ContainerView.refresh()`, qui tourne déjà à
  chaque cycle de stats. Un `running → exited` se voit donc en 5 s **sans même**
  que la détection de changement se déclenche.
- **Bascules réseau du HUD** : `drawNetworksSwitches()` remet aujourd'hui tous les
  réseaux à « activé ». Un rafraîchissement ne doit pas réactiver en douce un
  réseau que l'utilisateur a masqué → conserver les choix existants.
- **Ancrage de groupe** : quand le premier conteneur d'un compose est déjà tracé,
  partir de **sa** cellule réelle pour placer les nouveaux venus, sinon un
  conteneur qui rejoint un groupe existant atterrit loin de son groupe.
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

- [x] Ajout / suppression / changement d'état d'un conteneur se reflètent **sans**
      `location.reload()`.
- [x] Le placement libère la cellule d'un conteneur disparu (réutilisable).
- [x] Zoom / pan / console préservés lors d'un rafraîchissement.
- [x] Tests sur la logique de réconciliation du rendu (placement, drapeaux).
- [x] Validation navigateur avec le mock (`mock/fixtures/containers.json` modifié
      à chaud si possible) — voir `meta/recipes/verify-in-browser.md`.
- [x] Doc à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 15:43] Ticket pris sur `claude/refresh-incremental`. Tri de `100-follow-up/` fait avant : candidat des fixtures **promu**, boîte vide.
- [2026-07-27 15:45] `ContainerPlacement` gagne `release()` / `isOccupied()` : une cellule rendue redevient réutilisable.
- [2026-07-27 15:47] Le renderer tient son **propre registre** `id → {x, y, house}`. Sans lui, impossible de libérer la bonne cellule : quand la réconciliation a lieu, le repository a déjà détruit l'élément et oublié le modèle.
- [2026-07-27 15:48] `syncContainers()` : libère les partis, dessine les nouveaux, efface la couche réseau et la retrace. Routes redessinées **en bloc** — un départ peut couper une route qui servait trois conteneurs.
- [2026-07-27 15:49] Ancrage de groupe : un conteneur qui rejoint un compose déjà tracé part de la cellule **réelle** de son groupe, au lieu d'être replacé de zéro (il atterrissait loin des siens).
- [2026-07-27 15:50] `ContainerView.refresh()` remet aussi la classe `state--*` : un `running → exited` se voit au cycle de stats suivant, sans même que la détection de changement se déclenche.
- [2026-07-27 15:51] `KingdomHud.drawNetworksSwitches()` conserve les choix de l'utilisateur : un rafraîchissement ne doit pas réactiver en douce un réseau masqué.
- [2026-07-27 15:52] `onContainersChanged` → `refreshKingdom()` : **plus aucun `location.reload()` dans l'app**.
- [2026-07-27 16:00] **Défaut trouvé au navigateur, pas en test** : après réconciliation, `_networkElements` contenait 914 éléments et le DOM 0. Les éléments ajoutés après le démarrage vivent dans le graphe de scène **sans DOM** tant que le viewport n'a pas été rendu — au démarrage c'est `init()` qui peint. `refreshKingdom()` rend donc le viewport après la réconciliation. Verrouillé par un test qui vérifie l'**ordre** sync → render.

### Vérification

- [2026-07-27 15:55] Première tentative de validation **invalide** : j'ai retiré un conteneur en éditant `mock/fixtures/containers.json`, mais Vite surveille le fichier et a rechargé la page — impossible de distinguer « l'app se rafraîchit » de « Vite recharge ». Fixtures restaurées, méthode changée : interception de `fetch` dans la page, aucun fichier touché.
- [2026-07-27 15:58] Deuxième mesure **faussée par ma sonde** : `delete window.fetch` supprime `fetch` (propriété propre de `window`), donc l'app a reçu `ReferenceError`, `getContainersDescriptors()` a renvoyé `[]`, et les 35 maisons ont disparu. Ce n'était pas une régression — mais ça a révélé un vrai défaut, déposé en candidat (`2026-07-27_16-05`).
- [2026-07-27 16:02] Mesure propre, depuis un chargement neuf : **35 → 34 → 35 maisons**, la maison du conteneur revenu est bien présente, routes retracées (880 → 844 → 906), **`window.__sansReload` intact** (aucun rechargement) et zoom `scale(1.4)` **préservé**.
- [2026-07-27 16:03] Réconciliation à vide : neutre — 35 maisons et 880 routes avant comme après.
- [2026-07-27 16:04] Sonde temporaire (`window.__kingdom`) retirée ; `git diff` de `bootstrap.js` vide.
- [2026-07-27 16:04] `npm run verify` vert : lint + build + **232 tests** (35 fichiers), dont 7 nouveaux sur la réconciliation et le rendu.

### Validation

- [2026-07-27 16:06] Review : DoD cochée, frontière moteur respectée, sonde temporaire retirée, aucun `git add -A`, Conventional Commits en français.
- [2026-07-27 16:06] Deux mesures fausses avant la bonne (rechargement de Vite, puis `fetch` cassé par ma propre sonde) : consignées dans le journal plutôt que tues — la seconde a produit un vrai candidat.
- [2026-07-27 16:07] Merge `--no-ff` de `claude/refresh-incremental` sur `main` : **cfbec43**. Candidat déposé sur `main` avant merge, branche supprimée, worktree conservé.
