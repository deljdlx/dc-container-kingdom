---
id: 2026-07-26_14-21
title: Le watch par conteneur cible un sélecteur inexistant (mémoire jamais rafraîchie)
type: fix
branch:
created: 2026-07-26 14:21
ready:
doing:
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

### Technique

- Corriger le sélecteur — et surtout **cesser de retrouver le nœud par
  `document.querySelector`** : `ContainerView` a déjà l'élément moteur
  (`container.getElement().getDom()`), donc une requête locale (ou un nœud mis en
  cache au rendu) suffit et supprime la dépendance à la structure HTML globale.
- Remplacer les N timers par **un** ordonnanceur unique (le repository ou
  `ContainerKingdom`) qui pousse les vues, ou aligner le rafraîchissement sur le
  cycle de stats existant (`loadContainersStats`, 5 s) — les stats ne changent pas
  plus vite que leur polling, donc un watch à 1 s n'apporte rien.
- Garder `stopWatch()` (ou son équivalent) : la sortie de scène d'un conteneur ne
  doit laisser aucun timer.

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
- [ ] Un seul ordonnanceur de rafraîchissement (ou watch aligné sur le cycle de
      stats) ; aucun timer orphelin après retrait d'un conteneur (test).
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
