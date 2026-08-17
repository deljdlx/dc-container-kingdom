---
id: 2026-08-17_19-50
title: Le héros ne tire pas sur ce qui le touche
type: fix
branch: claude/point-blank
created: 2026-08-17 19:50
ready: 2026-08-17 19:50
doing: 2026-08-17 19:52
verify: 2026-08-17 20:05
done:
---

## Objectif

Signalé en jouant : « quand les ennemis sont trop proches le héros ne tire plus ».

Vrai, et pire que l'impression. Mesuré sur une minute de jeu, cap tenu plein
nord, part des assaillants **dans** le cône de 60° :

| distance | dans le cône |
|---|---|
| hors portée (> 132) | 99 % |
| 80 – 132 | 59 % |
| 50 – 80 | **0 %** |
| 25 – 50 | **0 %** |
| 0 – 25 (contact) | **0 %** |

**Rien en deçà de 80 px n'était jamais visable.** Un cône d'angle fixe est un
couteau à courte portée : à 25 px, ±30° ne fait plus que ±14 px de tolérance
latérale, alors que les assaillants convergent en s'écartant de l'axe. Le héros
ne pouvait pas tirer sur ce qui le mangeait — exaspérant, et physiquement absurde :
on n'a pas besoin de *faire face* à ce qui est collé à soi.

## Spécifications

Un **rayon rapproché** dans lequel le cap ne compte plus : tout ce qui est à
moins de `POINT_BLANK` est une cible valable, quelle que soit la visée.

Le réglage de ce rayon est **la** difficulté, et il a fallu le mesurer :

- à **46 px**, il devient une bulle — un héros passif laisse la vague y entrer et
  abat tout à loisir. Survie jusqu'à la vague 6 sans jamais tourner : la propriété
  centrale du jeu revendue contre du confort.
- à **30 px** (le contact est à 22), il ne répond qu'à ce qui mord déjà. La foule
  qui approche entre 40 et 80 px doit toujours être regardée.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : retour de jeu du 2026-08-17, sur `2026-08-17_18-10`.
- `src/arena/arena.js` — `targetInArc()`, `POINT_BLANK`, `ATTACKERS`.

## Definition of Done

- [x] Ce qui touche le héros est **abattable**, quel que soit le cap — mesuré.
- [x] Le rayon rapproché ne devient pas une bulle : un héros passif meurt.
- [x] `npm run verify` vert.

## Suite

- **L'équilibrage n'est pas réglé, et je le dis plutôt que de le maquiller.**
  L'écart mesuré entre « cap figé » et « visée active » reste faible (29 s contre
  34 s), ce qui devrait être un fossé.
- **Mon étalon est mauvais** : la sonde qui simule un joueur se réoriente vers la
  menace la plus proche deux fois par seconde, donc elle change de cap sans arrêt
  et gâche ses tirs. Elle sous-estime un humain, et régler contre elle pousse les
  valeurs plus loin qu'il ne faudrait. **À rejuger en jouant à la main** — c'est
  la seule mesure qui vaudra.
- Les points de vie (3 / 6 / 4) sont un **milieu** assumé entre deux extrêmes
  mesurés, pas un optimum.

## Journal

### Travail

- [2026-08-17 19:52] Branche `claude/point-blank`. `targetInArc()` saute le test
  du cône sous `POINT_BLANK`.
- [2026-08-17 19:58] Premier réglage à 46 px : le tir au contact revient (**25
  corps abattus sur 26** entrés dans le rayon) mais un cap figé survit jusqu'à la
  vague 6. Ramené à **30 px**.
- [2026-08-17 20:02] À 30 px, viser ne servait toujours pas beaucoup : la cadence
  suffisait à broyer tout le monde au corps-à-corps. Points de vie relevés — 2/4/3
  → 4/8/5 (trop dur), puis **3/6/4**.

### Vérification

| | cap figé | visée active | + achats |
|---|---|---|---|
| rayon 46 px | survit vague 6 | — | — |
| rayon 30 px, PV 2/4/3 | 90 s / vague 5 | 82 s / vague 5 | 95 s / vague 6 |
| rayon 30 px, PV 4/8/5 | 29 s / vague 2 | 34 s / vague 2 | 49 s / vague 3 |

Le tir au contact est rétabli, la bulle est évitée. L'écart figé/actif, lui,
reste trop mince — voir `## Suite`.

`npm run verify` vert : 71 fichiers, 623 tests.

### Validation

- Fusionné sur `main` en `--no-ff`.
