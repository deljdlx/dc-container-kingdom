---
id: 2026-07-30_12-09
title: L'extrait de pilotage rAF vit en trois copies
type: docs
branch: copilot/single-raf-snippet
created: 2026-07-30 12:09
ready: 2026-07-30 12:20
doing: 2026-07-30 12:20
verify: 2026-07-30 12:22
done: 2026-07-30 12:22
---

## Objectif

Le même bloc de code — piloter la game loop à la main parce que rAF est en pause
hors premier plan — est recopié dans **trois** fichiers :

- `meta/agents/workflow.md` (« Piège de vérification au navigateur »)
- `meta/documentation/development.md`
- `meta/recipes/verify-in-browser.md`

Constat direct, pas une supposition : lors de `2026-07-26_14-22` (entrées clavier),
l'API du viewport a changé et il a fallu corriger l'extrait **trois fois**. Les trois
copies posaient `vp.moving = 1; vp.direction = …`, une API qui n'existait plus.

C'est le mode de défaillance exact que la génération des points d'entrée a supprimé
(`2026-07-29_08-51`) : trois copies d'un même contenu, dont deux seront oubliées.
Ici, aucun générateur n'est nécessaire — une copie canonique et deux liens suffisent.

## Spécifications

_Amorce — à confirmer en « specify »._

- **La copie canonique va dans `meta/recipes/verify-in-browser.md`** : c'est la
  recipe **projet** (elle cite `src/engine/demo/`, `window.__vp`, une API concrète),
  et les recipes agent sont censées rester agnostiques.
- Les deux autres emplacements gardent **le piège** (rAF en pause → tout gèle, une
  sonde qui `await` un rAF timeoute) et **renvoient** vers la recipe pour le
  comment. Le piège est une règle ; l'extrait est une procédure.
- Vérifier au passage qu'aucune autre copie ne dort ailleurs :
  ```bash
  grep -rln "vp.update(\|viewport.update(timestamp)" --include=*.md .
  ```

### Risque

`meta/agents/workflow.md` est un fichier de **règles**, lu par tout agent neuf : en
retirant l'extrait, garder l'avertissement suffisamment explicite pour que personne
ne « découvre » le piège en perdant une heure sur une sonde qui timeoute.

## Contexte / liens

- Les trois copies, listées ci-dessus.
- Précédent du même défaut, réglé par génération : `2026-07-29_08-51`.
- L'épisode qui l'a révélé : `2026-07-26_14-22`, journal du 2026-07-29 09:53.

## Definition of Done

- [x] Une seule copie de l'extrait dans tout le dépôt (grep en preuve au journal).
- [x] Les deux autres emplacements conservent l'avertissement et pointent la recipe.
- [x] Les liens résolvent (le garde-fou le vérifie).
- [x] `npm run verify` vert.

## Suite

aucune

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-07-30 12:20] Ticket déplacé en `040-doing` sur la branche `copilot/single-raf-snippet`.
- [2026-07-30 12:20] Copie canonique de l'extrait rAF déplacée dans [meta/recipes/verify-in-browser.md](../../recipes/verify-in-browser.md) ; les deux autres emplacements gardent un pointeur vers cette recipe.

### Vérification

- [2026-07-30 12:22] `rg -n "vp\.update\(|viewport\.update\(timestamp\)" meta/agents meta/documentation meta/recipes meta/workflow --glob '*.md'` ne laisse qu'une seule copie du bloc rAF, dans [meta/recipes/verify-in-browser.md](../../recipes/verify-in-browser.md).

### Validation

- [2026-07-30 12:22] `npm run verify` vert après la centralisation du bloc rAF.
