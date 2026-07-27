---
id: 2026-07-27_17-55
title: Git Kingdom — visualiser des dépôts git avec le moteur (chapeau)
type: feat
group: git-kingdom
branch:
created: 2026-07-27 17:55
ready:
doing:
verify:
done:
---

## Objectif

Une **seconde application** sur le même moteur : visualiser des dépôts git
publics comme Container Kingdom visualise des conteneurs Docker.

Ce n'est pas un simple lot de tâches — c'est le **premier vrai test de la
frontière moteur**. Elle tient aujourd'hui : hors `demo/` et `catalog/`, la seule
occurrence de « Docker » ou « Container Kingdom » dans `src/engine/` est un
commentaire qui affirme qu'il n'y en a pas. Un second consommateur transformera
cette affirmation en preuve — ou révélera ce que Container Kingdom tient pour
acquis.

**Ticket chapeau** : il ne s'implémente pas lui-même. Il porte l'intention, la
décision d'architecture et la liste des enfants ; le travail se fait dans ceux-ci.

## Décisions déjà prises

- **Emplacement : `src/git-kingdom/`, dans ce dépôt.** Pas d'extraction du moteur
  en package npm pour l'instant : versioning et publication coûtent cher tant que
  les deux applications vivent ensemble. Le jour où la friction apparaît, elle
  sera documentée par l'usage — et l'extraction sera un ticket, pas un pari.
- **Le moteur s'importe par le baril `src/engine/index.js`**, comme Container
  Kingdom. Aucune dépendance entre les deux applications.

## La question de conception, non tranchée : qu'est-ce qui vit ?

Container Kingdom est vivant parce que Docker fournit des métriques **qui
bougent** : CPU, mémoire, état, apparition et disparition de conteneurs. La carte
se réconcilie en place et le royaume respire.

Un dépôt git, lui, est essentiellement **statique**. Ce qui bouge, c'est
l'**activité** : commits récents, PR ouvertes, issues, contributeurs actifs,
releases. Sans réponse à « qu'est-ce qui anime la carte ? », on obtient un joli
royaume figé — et on perd précisément ce qui fait l'intérêt du premier.

C'est **la** décision à prendre avant le mapping dépôt → maison, pas après.
Quelques axes, à arbitrer :

- **Le temps comme moteur** — rejouer l'historique (le royaume se construit
  commit après commit) plutôt que d'afficher un état.
- **L'activité comme métrique vivante** — fréquence de commits ↔ ce que le CPU
  est à Container Kingdom.
- **Assumer le statique** — une carte-atlas, belle et navigable, sans prétendre
  respirer. Réponse légitime, à condition d'être choisie.

## Contraintes connues

- **`src/index.html` est occupé** par Container Kingdom (son HTML est à la racine
  de `src/`, son JS dans `src/container-kingdom/`). Deux applications ne peuvent
  pas tenir cette place — prérequis, voir l'enfant dédié.
- **Le mock est câblé globalement** : `dockerMockPlugin()` dans `vite.config.js`.
  Git Kingdom a besoin du sien ; à généraliser ou à juxtaposer.
- **Source distante et limitée** : l'API GitHub plafonne à 60 req/h en anonyme
  (5 000 authentifié), là où le socket Docker est local et illimité. Le cache
  n'est pas un raffinement, c'est une contrainte de départ.

## Enfants

Reliés par `group: git-kingdom` :

```bash
grep -l "^group: git-kingdom" meta/workflow/*/*.md
```

- `2026-07-27_17-56` — libérer `src/index.html` (prérequis, sans rapport avec la
  conception de Git Kingdom)
- `2026-07-27_17-57` — source de données GitHub + mock de dev
- `2026-07-27_17-58` — trancher ce qui vit sur la carte, puis le mapping

## Definition of Done

Un chapeau se clôt quand ses enfants sont clos ou explicitement abandonnés.

- [ ] La question « qu'est-ce qui vit ? » est **tranchée et écrite** ici.
- [ ] Tous les enfants sont en `080-done`, ou retirés avec leur raison.
- [ ] Ce que le second consommateur a révélé sur la **frontière moteur** est
      consigné — ce qui a dû être ajouté, généralisé ou déplacé dans `src/engine/`.
- [ ] `meta/documentation/` décrit les deux applications, pas seulement une.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
