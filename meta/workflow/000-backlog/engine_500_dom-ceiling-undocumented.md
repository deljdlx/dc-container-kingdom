---
id: 2026-08-07_16-32
title: Le plafond du rendu DOM est mesuré mais nulle part écrit
type: docs
branch:
created: 2026-08-07 16:32
ready:
doing:
verify:
done:
---

## Objectif

Personne ne savait combien d'éléments le moteur tient. La passe d'audit B du
2026-08-06 l'a mesuré, et ce chiffre commande des décisions d'architecture —
à commencer par la règle de routage DOM / canvas (`2026-08-06_17-56`).

Mesuré sur la démo. **Réserve de méthode** : onglet en arrière-plan, donc rAF
suspendu — ce sont le **temps script** et un **layout forcé** (lecture d'une
géométrie après la frame) ; le **compositing n'est pas mesuré**. Ordre de
grandeur, pas garantie.

| éléments | nœuds DOM | ms script | ms layout forcé |
|---|---|---|---|
| 301 | 1 108 | 0,7 | 2,2 |
| 501 | 1 708 | 1,6 | 3,4 |
| **1 001** | 3 208 | 3,5 | **16,2** |
| 2 001 | 6 208 | 4,3 | 18,6 |
| 3 501 | 10 708 | 6,6 – 14,6 | 29,9 |

Budget d'une frame à 60 fps : **16,6 ms**. C'est le **layout du navigateur** qui
le franchit en premier, vers **1 000 éléments** — pas les algorithmes du moteur.
Chaque élément coûte **3 nœuds DOM**.

## Spécifications

_À confirmer en « specify »._

- Consigner ces chiffres dans `meta/documentation/engine.md`, **avec leurs
  réserves de méthode** — un chiffre sans son protocole se retourne contre celui
  qui s'y fie.
- Décider s'il faut les rendre **reproductibles** : un petit banc dans la démo
  (`?bench=1` ?) plutôt qu'une sonde jetable, pour que le chiffre se revérifie
  après un changement de rendu.

## Firewalls / risques

1. **Un chiffre daté n'est pas une loi** : il dépend de la machine, du navigateur
   et du contenu des éléments. L'écrire avec sa date et son contexte.
2. **Ne pas transformer le plafond en interdit** : c'est une échelle de décision,
   pas une limite dure.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-07**, `080-done` compris.
- Origine : passe d'audit B, candidat déposé le 2026-08-06, trié le 2026-08-07.
- La règle qu'il justifie : `2026-08-06_17-56`.
- Le premier poste de coût trouvé par la même passe : `2026-08-06_17-20`.

## Definition of Done

- [ ] Les chiffres et leurs réserves sont dans `meta/documentation/engine.md`.
- [ ] Le sort du banc reproductible est **tranché et écrit** (fait ou écarté).
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
