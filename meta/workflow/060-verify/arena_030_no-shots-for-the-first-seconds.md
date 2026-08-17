---
id: 2026-08-17_19-25
title: Le héros reste sans tirer pendant les premières secondes d'une vague
type: fix
branch: claude/arena-dead-time
created: 2026-08-17 19:25
ready: 2026-08-17 19:25
doing: 2026-08-17 19:26
verify: 2026-08-17 19:30
done:
---

## Objectif

Signalé en jouant, le 2026-08-17 : « au bout d'un moment le héros ne tire plus ».

Rien n'est cassé, et c'est ce qui rend le défaut intéressant : mesuré, le premier
ennemi était à **130 px** quand la portée est de **116**. Ils descendaient si
lentement (10–24 px/s sur un terrain de 288 px) qu'il s'écoulait **treize
secondes** entre le début d'une vague et le premier tir possible — cinq
assaillants bien visibles à l'écran, et un héros immobile qui ne fait rien.

**Un temps mort est un bug, même quand chaque pièce fonctionne.**

## Spécifications

Réduire l'attente **sans rallonger la portée au-delà de ce que la géométrie
autorise** : au-delà de 144 px, un corps de la colonne extérieure entre en portée
alors qu'il est encore dans un cône de 60° pointé au nord, et les flancs cessent
d'être des flancs — c'est la propriété sur laquelle tout le jeu repose
(`2026-08-17_18-10`).

Trois leviers, tous côté hôte : la vitesse des assaillants, leur point
d'apparition, la cadence de la vague.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : retour de jeu du 2026-08-17, sur `2026-08-17_18-10` fraîchement clos.
- `src/arena/arena.js` — `ATTACKERS`, `RANGE_BASE`, `spawnAttacker`, `startWave`.

## Definition of Done

- [x] Le premier tir d'une vague part en **moins de 6 s**, mesuré.
- [x] La portée reste **sous le plafond de 144 px** qui rendrait les flancs
      couvrables.
- [x] L'ordre viser > subir est **préservé**, mesuré.
- [x] `npm run verify` vert ; les quatre hôtes sans erreur console.

## Suite

- **L'équilibrage reste un premier jet.** La partie dure une minute ; c'est
  arcade, pas forcément voulu. À reprendre en jouant vraiment, pas en simulant.
- La sonde qui pilote un « joueur » (réorienter vers la menace la plus proche)
  est un pilote médiocre : elle change de cap en permanence et gâche des tirs.
  Les chiffres qu'elle donne sont un **plancher**, pas une mesure de skill.

## Journal

### Travail

- [2026-08-17 19:26] Branche `claude/arena-dead-time`. Vitesses des assaillants
  ×2 (30 / 21 / 44 px/s), apparition remontée de `y = -48` à `-32`, vague plus
  groupée (`850 - vague × 60`, plancher 220 ms).
- [2026-08-17 19:28] Le doublement des vitesses a rendu le jeu injouable — viser
  ne tenait plus que 31 s. Compensé par ce que la géométrie permettait : portée
  **116 → 132** (plafond 144), cadence **450 → 380 ms**, et le coriace ramené de
  5 à 4 PV.

### Vérification

Mesures au navigateur, boucle pilotée à la main :

| | avant | après |
|---|---|---|
| premier tir d'une vague | **13 s** | **5,2 s** |
| cap figé | mort vague 1 | mort vague 1 |
| visée active, sans achat | 155 s / vague 5 | 42 s / vague 3 |
| visée active, avec achats | 200 s / vague 8 | 68 s / vague 4 |

L'ordre est préservé — jouer bat subir, acheter aide — mais les parties sont
**nettement plus courtes** : les vagues arrivent deux fois plus vite pour un
héros à peine plus fort. C'est un jeu d'arcade tendu plutôt qu'une longue
montée ; à rejuger en jouant à la main.

Vérifié aussi que la portée de 132 reste sous le plafond : un corps de la colonne
extérieure (dx = 72) est dans le cône tant que `y < 121`, et n'entre en portée
qu'à `y > 136`. Les deux fenêtres ne se recoupent pas.

`npm run verify` vert ; les quatre hôtes sans erreur console.

### Validation

- Fusionné sur `main` en `--no-ff`.
