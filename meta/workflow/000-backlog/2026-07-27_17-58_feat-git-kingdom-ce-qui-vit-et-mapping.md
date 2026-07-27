---
id: 2026-07-27_17-58
title: Git Kingdom — trancher ce qui vit sur la carte, puis le mapping
type: feat
group: git-kingdom
branch:
created: 2026-07-27 17:58
ready:
doing:
verify:
done:
---

## Objectif

Décider **ce qui anime la carte**, puis traduire un dépôt git en éléments du
moteur. Dans cet ordre : le mapping découle de la réponse, jamais l'inverse.

Container Kingdom vit parce que Docker donne des métriques qui bougent — CPU,
mémoire, état, apparitions et disparitions. Un dépôt git est essentiellement
**statique** : ce qui bouge, c'est l'activité (commits, PR, issues, releases),
et à l'échelle du jour, pas de la seconde. Sans réponse explicite, Git Kingdom
sera un royaume figé — joli, et mort.

## Spécifications

_Rempli en « specify » — c'est là que la décision se prend._

### Trois axes, à trancher

- **Le temps comme moteur** — rejouer l'historique : le royaume se construit
  commit après commit, on regarde le dépôt *pousser*. C'est le plus proche de
  l'esprit RPG, et le plus coûteux (il faut l'historique, pas un état).
- **L'activité comme métrique vivante** — la fréquence de commits joue le rôle
  que le CPU joue chez Container Kingdom : un dépôt actif s'agite, un dépôt
  dormant s'endort. Proche de l'existant, donc réutilisable tel quel.
- **Assumer le statique** — un atlas navigable, sans prétendre respirer.
  Réponse **légitime**, à condition d'être choisie et écrite, pas subie.

### Puis le mapping

Une fois l'axe choisi : dépôt → maison ? langage → biome ou couleur ?
contributeurs → PNJ ? forks / étoiles → taille ? dépendances → routes, comme les
réseaux Docker ? Ce qu'on **écarte** compte autant que ce qu'on retient.

**Contrainte forte** : tout passe par le baril `src/engine/index.js`. Si le
mapping réclame un élément visuel qui n'existe pas, il se crée **côté moteur**
(voir `meta/agents/engine-boundary.md`) — et le catalogue en profite. C'est
exactement le genre de besoin qui prouvera, ou non, que la frontière tient.

## Contexte / liens

- Modèles : `src/container-kingdom/js/ContainerKingdomRenderer.js` (maisons,
  routes, décor), `ContainerPlacement.js` (placement déterministe)
- `src/engine/index.js` (baril), `/engine/catalog/` (ce qui existe déjà : 414
  éléments, 44 familles)
- Chapeau : `2026-07-27_17-55` · Données : `2026-07-27_17-57`
- Attention aux leçons du tracé Docker : `2026-07-27_17-37` (routes en double —
  ne pas reproduire la chaîne d'ordre arbitraire si les dépendances deviennent
  des routes)

## Definition of Done

- [ ] La réponse à « qu'est-ce qui vit ? » est **écrite et justifiée**, y compris
      si c'est « rien ne bouge, c'est un atlas ».
- [ ] Le mapping est écrit : ce qui est retenu **et ce qui est écarté**.
- [ ] Un dépôt réel s'affiche sur la carte, vérifié **au navigateur**.
- [ ] Le placement est **déterministe** (même entrée → même carte), testé.
- [ ] Tout élément visuel manquant a été ajouté **côté moteur**, exporté par le
      baril, et apparaît dans le catalogue.
- [ ] `npm run verify` vert ; `meta/documentation/` décrit la nouvelle app.

## Suite

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
