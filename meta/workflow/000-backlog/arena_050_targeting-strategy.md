---
id: 2026-08-17_20-55
title: Monter le ciblage sur une stratégie interchangeable
type: refactor
branch:
created: 2026-08-17 20:55
ready:
doing:
verify:
done:
---

## Objectif

`targetInArc()` fait **trois métiers** dans une fonction :

1. **rassembler** — interroger le board, résoudre le registre de l'hôte (dépend
   du board, du DOM, de l'état de la partie) ;
2. **filtrer** — portée, cône, exception rapprochée (géométrie pure) ;
3. **choisir** — le plus proche (pure).

C'est ce nœud qui la rend **intestable**, et ce n'est pas théorique : je me suis
trompé **deux fois** sur le filtrage en deux jours — le cône trop large qui
couvrait tout le terrain (`2026-08-17_18-10`), puis le cône qui ne couvrait rien
en deçà de 80 px (`2026-08-17_19-25`). Les deux fois, il a fallu instrumenter le
navigateur pour le voir, alors que trois assertions sur des nombres auraient
suffi.

Accessoirement, « le plus proche » est **une** politique parmi d'autres, câblée en
dur : rien ne permet de viser le plus faible (pour ne pas gaspiller de tirs sur
un corps déjà mort) ou le plus coriace.

## Spécifications

### La couture

- Un module `src/arena/targeting.js`, sans aucune dépendance au DOM ni au moteur.
- **`inSight(candidate, sight)`** — l'éligibilité, en un seul endroit : portée,
  cône, exception rapprochée. C'est la pièce que j'ai ratée deux fois, elle mérite
  ses propres tests.
- **Des stratégies** qui ne font que *choisir* parmi les éligibles :
  `nearest`, `weakest`, `toughest`. Trois, parce qu'**un pattern à une seule
  implémentation n'est pas un pattern, c'est une indirection**.
- **`pickTarget(candidates, sight, strategy)`** — filtre puis choisit.

Les candidats sont des objets **plats** (`{ element, at, distance, offAxis, hp }`)
que l'hôte fabrique. C'est ce qui rend tout ça testable sans navigateur.

### Ce qui reste où

Le **rassemblage** reste dans `arena.js` : c'est lui qui connaît le board, le
masque de couche et le registre des assaillants.

Et tout cela reste **côté hôte, pas dans le moteur**. « La plus proche » ou « la
plus faible » est une règle de jeu ; le moteur ne sait pas ce qu'est un ennemi, et
la frontière dit que l'app dépend du moteur, jamais l'inverse.

### La preuve que c'est interchangeable

Une commande en jeu pour changer de stratégie. Sans elle, le pattern n'a aucun
effet observable et personne ne saurait dire s'il marche.

## Firewalls / risques

1. **Ne pas changer le comportement.** `nearest` doit reproduire exactement ce
   que fait le code d'aujourd'hui — le refactor se juge à ça.
2. **Ne pas remonter dans le moteur.** Pas de requête conique, pas de notion de
   « cible » dans `src/engine/` : rien ne l'a mesurée comme nécessaire.
3. **Ne pas inventer de stratégies sans usage.** Trois suffisent à prouver la
   couture ; une quatrième sans joueur pour la vouloir serait du décor.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : demande du 2026-08-17 (« le ciblage monté sur un pattern stratégie »).
- `src/arena/arena.js` — `targetInArc()`, `POINT_BLANK`, `stats.arc/range`.
- Les deux défauts qui motivent la testabilité : `2026-08-17_18-10`,
  `2026-08-17_19-25`.

## Definition of Done

- [ ] `src/arena/targeting.js` est **pur** : aucun import du moteur ni du DOM.
- [ ] `inSight` porte l'éligibilité, avec des tests sur les trois règles
      (portée, cône, rapproché) et leurs bords.
- [ ] **Trois** stratégies, testées, qui choisissent différemment sur le même jeu
      de candidats.
- [ ] `nearest` reproduit le comportement actuel — vérifié en jeu.
- [ ] La stratégie est **changeable en jeu**, et le changement se voit.
- [ ] `npm run verify` vert ; les quatre hôtes sans erreur console.

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
