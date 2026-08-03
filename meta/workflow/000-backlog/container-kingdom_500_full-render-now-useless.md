---
id: 2026-08-03_09-25
title: Container Kingdom re-rend tout le royaume à chaque rafraîchissement
type: refactor
branch:
created: 2026-08-03 09:25
ready:
doing:
verify:
done:
---

## Objectif

`ContainerKingdom.js:70` et `:88` appellent `viewport.render()` — un **re-rendu
complet** — après chaque rafraîchissement de la liste des conteneurs.

C'était la parade au défaut corrigé par `2026-08-02_20-45` : attacher un élément
ne le faisait pas apparaître. Le parcours de redessin par frame s'en charge
désormais seul.

Aucun bug : c'est du travail inutile. Mais l'app repeint un royaume entier
(**535 éléments, 49 areas** mesurés) à chaque cycle là où quelques nœuds
suffiraient — et le code garde une ligne dont la raison d'être a disparu, donc
que le prochain lecteur croira nécessaire.

## Spécifications

_À confirmer en « specify »._

Retirer les deux appels et vérifier au navigateur que les conteneurs
apparaissent, disparaissent et changent d'état correctement — **ou** constater
qu'ils couvrent encore un cas (un conteneur qui change d'area ? un changement de
réseau qui rebâtit la carte ?) et l'écrire dans le code.

## Firewalls / risques

1. **Le rafraîchissement incrémental a déjà son ticket clos**
   (`2026-07-26_14-20`) : relire ce qu'il a mis en place avant de toucher au
   chemin de rendu.
2. **Le changement de réseau / de filtre** rebâtit potentiellement toute la carte —
   ce cas-là a peut-être encore besoin d'un rendu complet. À distinguer du simple
   refresh de statuts.
3. **Mesurer, pas supposer** : compter les écritures DOM par cycle de refresh
   avant/après, sinon on ne saura pas si on a gagné quoi que ce soit.

## Contexte / liens

- Origine : candidat déposé à la clôture de `2026-08-02_20-45`, trié le 2026-08-03.
- `src/container-kingdom/js/ContainerKingdom.js:70,88`.
- `src/engine/view/Viewport.js` — le parcours par frame qui rend ces appels inutiles.
- Ticket voisin clos : `2026-07-26_14-20` (refresh incrémental sans reload).

## Definition of Done

- [ ] Les conteneurs apparaissent / disparaissent / changent d'état sans
      `viewport.render()` explicite — vérifié au navigateur sur un cycle complet.
- [ ] **Mesure du gain** : écritures DOM par rafraîchissement avant/après, citée.
- [ ] Si un appel reste nécessaire, la raison est **écrite en commentaire**.
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
