---
id: 2026-08-17_18-23
title: Le CSS du moteur ne pixelise pas au zoom
type: fix
branch:
created: 2026-08-17 18:23
ready:
doing:
verify:
done:
---

## Objectif

Repéré en spécifiant l'arène (`2026-08-11_08-55`).

`image-rendering: pixelated` n'existe que dans `catalog.css`. Or dès qu'un hôte
zoome — ce qu'un écran de téléphone impose pour des sprites de 32 px —
l'interpolation par défaut du navigateur transforme le pixel art en bouillie.

L'arène le pose elle-même sur son conteneur. La question est de savoir si c'est
au moteur de le faire (il livre les sprites et connaît leur nature) ou à l'hôte
(c'est une décision de rendu, et un hôte pourrait vouloir du lissage).

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : candidat déposé à la clôture de `2026-08-11_08-55`, trié le 2026-08-17.
- `src/engine/css/map.css`, `character.css` — où la règle manquerait.
- `src/engine/catalog/catalog.css` — le seul endroit qui l'a.
- `src/arena/arena.css` — l'hôte qui la pose lui-même, faute de mieux.

## Definition of Done

- [ ] Le sort est tranché — moteur ou hôte — et **écrit** avec sa raison.
- [ ] Si c'est le moteur : un hôte peut toujours revenir au lissage.
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
