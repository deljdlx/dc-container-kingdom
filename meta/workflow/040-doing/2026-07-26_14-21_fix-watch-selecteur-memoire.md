---
id: 2026-07-26_14-21
title: Le watch par conteneur cible un sélecteur inexistant (mémoire jamais rafraîchie)
type: fix
branch: claude/fix-watch-selecteur-memoire
created: 2026-07-26 14:21
ready: 2026-07-27 10:52
doing: 2026-07-27 10:53
verify:
done:
---

## Objectif

`ContainerView.watch()` cherche
`[data-container-id="…"] .memory-usage` pour réécrire la consommation mémoire de la
maison. Or la maison est rendue avec la classe **`container__memory-usage`**
(`ContainerKingdomRenderer.drawHouse()`), et `.memory-usage` n'existe que dans le
HUD (hors de tout `[data-container-id]`). Le sélecteur ne matche donc **jamais** :
la mémoire affichée sur la maison est celle du premier rendu, figée.

Au passage : ce `watch()` est un `setTimeout` **par conteneur** (1 s) qui fait un
`document.querySelector` global à chaque tick. Sur une infra de 30 conteneurs,
c'est 30 timers et 30 requêtes DOM par seconde pour, aujourd'hui, ne rien mettre
à jour.

## Spécifications

### Fonctionnel

- La mémoire affichée sur la maison suit les stats du conteneur.
- L'indicateur CPU (`dataset.cpuUsage`) continue de fonctionner.

### Technique — tranché en *specify*

- **Le nœud se retrouve localement** : `ContainerView` a déjà l'élément moteur
  (`container.getElement().getDom()`), donc un `querySelector` **sur ce nœud**
  suffit — plus de dépendance à la structure HTML globale, et le bug de sélecteur
  ne peut plus revenir par une classe renommée ailleurs.
- **Suppression des timers, pas leur correction.** Les stats ne changent que
  lorsque `loadContainersStats()` s'exécute (cycle de 5 s) : un timer par
  conteneur à 1 s ne peut donc **rien** rafraîchir de neuf, il ne fait que du bruit
  DOM. Le rafraîchissement devient une **poussée** après chaque chargement de
  stats — la donnée pilote l'affichage, au lieu que l'affichage sonde la donnée.
- **Conséquence assumée** : sans timer, `stopWatch()` n'a plus d'objet. Retirer la
  méthode **et** ses appels (`ContainerRepository.loadContainers`, `clear`), plutôt
  que de laisser une API vide qui laisse croire qu'il reste quelque chose à
  arrêter.
- Le test `prunes containers that vanished and stops their watch` espionne
  `stopWatch` : le requalifier pour vérifier ce qui compte réellement — qu'un
  conteneur disparu **ne soit plus rafraîchi** — au lieu de vérifier l'appel d'une
  méthode qui n'existera plus.

## Contexte / liens

- `src/container-kingdom/js/ContainerView.js` (`watch`, `WATCH_INTERVAL_MS`)
- `src/container-kingdom/js/ContainerKingdomRenderer.js` (`drawHouse`, markup)
- `src/container-kingdom/css/containers/container.css`
  (`.container__memory-usage`), `src/container-kingdom/js/KingdomHud.js`
  (`.memory-usage`)

## Definition of Done

- [ ] La valeur mémoire de la maison se met à jour quand les stats changent
      (vérifié au navigateur avec le mock).
- [ ] Plus de `document.querySelector` global dans la boucle de watch.
- [ ] Plus **aucun timer par conteneur** : le rafraîchissement est poussé après
      chaque chargement de stats.
- [ ] Un conteneur retiré n'est plus rafraîchi — prouvé par un test, sans espionner
      une méthode qui n'existe plus.
- [ ] `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 10:53] Ticket pris sur `claude/fix-watch-selecteur-memoire`. Tri de `100-follow-up/` fait avant : boîte vide. Priorité choisie sur le backlog : fonctionnalité visiblement cassée, correctif minuscule, ticket indépendant.
- [2026-07-27 10:54] Défaut re-prouvé avant de coder : le sélecteur `.memory-usage` cherché dans tout le document contre un markup `container__memory-usage` — plus 35 timers d'une seconde qui ne rafraîchissent rien.
- [2026-07-27 10:55] Tests d'abord (`test/ContainerView.refresh.test.js`, 4 cas) : écriture de la valeur, **nœud cherché dans sa propre maison** (un leurre ailleurs dans la page ne doit pas être touché), absence de maison inoffensive, aucun timer planifié. Les 4 échouent avant correctif.
- [2026-07-27 10:56] `watch()` → `refresh()` : plus de `document.querySelector`, la vue s'adresse au nœud qu'elle possède. Un renommage de classe ailleurs ne peut plus la casser en silence.
- [2026-07-27 10:57] Timers **supprimés**, pas corrigés : les stats ne bougent qu'au chargement (cycle de 5 s), donc un timer par conteneur à 1 s ne pouvait rien rafraîchir de neuf. La donnée pousse désormais vers la vue depuis `ContainerKingdom.loadContainersStats()`.
- [2026-07-27 10:57] `stopWatch()` et ses appels retirés : laisser une API vide aurait laissé croire qu'il reste quelque chose à arrêter. La séparation est tenue — le repository expose `getContainerViews()` (données), l'orchestrateur pilote le DOM.
- [2026-07-27 10:58] Test `prunes containers… stops their watch` requalifié : il espionnait une méthode qui n'existe plus ; il vérifie maintenant **ce qui compte** — un conteneur disparu n'a plus de vue, donc plus rien à rafraîchir.

### Vérification

-

### Validation

-
