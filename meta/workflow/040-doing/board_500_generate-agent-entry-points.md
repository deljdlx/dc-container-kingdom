---
id: 2026-07-29_08-51
title: Générer AGENTS.md et copilot-instructions.md depuis une source unique
type: chore
branch: copilot/generate-agent-entry-points
created: 2026-07-29 08:51
ready: 2026-07-29 15:29
doing: 2026-07-29 15:29
verify:
done:
---

## Objectif

`CLAUDE.md`, `AGENTS.md` et `.github/copilot-instructions.md` partagent ~90 % de
texte **recopié** : même présentation du projet, mêmes commandes, mêmes cinq
règles essentielles. Trois fichiers à corriger à chaque évolution de règle, donc
un qui sera oublié.

Ce n'est pas hypothétique : c'est exactement là que s'est logé le drift de
colonnes constaté à l'audit du 2026-07-27 (`020-ready` absent des **trois**
entrées — voir le ticket `2026-07-29_08-50`). Une seule source aurait produit une
seule correction.

Le dépôt sait déjà générer un fichier versionné en CI
(`.github/workflows/update-main-readme.yml`) : le pattern est acquis, il reste à
l'appliquer là où la duplication coûte le plus cher.

## Spécifications

_Amorce — à confirmer / affiner en « specify »._

### Fonctionnel

Une seule source décrit le tronc commun (projet, commandes, règles essentielles,
pointeurs vers `meta/agents/`). Les trois entrées en dérivent, chacune gardant ce
qui lui est **propre** :

- `.github/copilot-instructions.md` — le préambule « ⛔ worktree obligatoire »
  avec le chemin `/tmp/dc-container-kingdom-copilot` ;
- `CLAUDE.md` — ses `@imports` de `meta/agents/*.md` ;
- `AGENTS.md` — rien de spécifique aujourd'hui.

Les liens relatifs diffèrent selon l'emplacement (`meta/…` à la racine,
`../meta/…` depuis `.github/`) : la génération doit les réécrire, c'est une des
choses qu'une copie manuelle rate.

### Technique — à trancher en *specify*

- **Où vit la source** : un fragment dédié dans `meta/agents/` (p. ex.
  `entry-points/common.md`) plutôt qu'un des trois fichiers promu au rang de
  maître — aucun des trois n'a de légitimité sur les autres.
- **Quand la génération tourne** : en CI (comme `update-main-readme.yml`) ou via
  un script appelé à la main et **vérifié** en CI (mode `--check` qui échoue si un
  fichier généré diverge de sa source). La seconde option évite les commits
  automatiques sur `main` et se marie avec le board-doctor (`2026-07-29_08-43`).
- **Marqueurs** : délimiter les zones générées (`<!--<GENERATED>-->…`) comme le
  fait déjà le README racine, pour que les parties propres survivent.

### Risques

- Un fichier généré qu'on édite à la main perd ses modifications sans bruit → le
  mode `--check` en CI est ce qui rend l'erreur visible.
- Ne pas gonfler les entrées au passage : elles **résument**, `meta/agents/` reste
  la source de vérité (règle posée par `meta/agents/README.md`).

## Contexte / liens

- Les trois entrées : `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`.
- Précédent de génération : `.github/workflows/update-main-readme.yml` et les
  marqueurs `<!--<SHORT-PRESENTATION>-->` du `README.md` racine.
- Règle « entrées minces, détail dans `meta/agents/` » : `meta/agents/README.md`.
- Contrôle 7 de `meta/agents/recipes/audit-workflow-consistency.md` (entrées
  alignées) — devient mécaniquement vrai une fois ce ticket fait.

## Definition of Done

- [x] Une source unique décrit le tronc commun ; les trois entrées en dérivent.
- [x] Les spécificités de chaque entrée (préambule worktree Copilot, `@imports`
      de `CLAUDE.md`) sont préservées.
- [x] Les liens relatifs sont corrects **dans les trois** fichiers générés.
- [x] Un `--check` (ou équivalent) échoue si un fichier généré diverge de sa
      source, et il est joué en CI.
- [x] Modifier une règle du tronc commun et régénérer met les trois entrées à
      jour — démontré au journal.
- [x] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 15:30] Création d'une source unique [meta/agents/entry-points/common.md](../../../agents/entry-points/common.md) pour le tronc commun (projet, commandes, règles, liens de détail) avec placeholder `{{META_PREFIX}}` pour les liens markdown.
- [2026-07-29 15:30] Ajout des marqueurs `<!--<ENTRYPOINT_COMMON>-->` / `<!--</ENTRYPOINT_COMMON>-->` dans [AGENTS.md](../../../AGENTS.md), [CLAUDE.md](../../../CLAUDE.md) et [.github/copilot-instructions.md](../../../.github/copilot-instructions.md), en conservant les sections spécifiques (préambule Copilot et `@imports` Claude).
- [2026-07-29 15:30] Ajout du générateur/check [scripts/generate-agent-entry-points.mjs](../../../scripts/generate-agent-entry-points.mjs), scripts npm [package.json](../../../package.json) et étape CI [quality.yml](../../../.github/workflows/quality.yml) via `npm run check:agent-entry-points`.
- [2026-07-29 15:31] Ajustement d'une règle du tronc commun dans [meta/agents/entry-points/common.md](../../../agents/entry-points/common.md) (bloc `Règles essentielles` rendu identique entre entrées) puis régénération immédiate pour démontrer la propagation.

### Vérification

- [2026-07-29 15:30] `npm run generate:agent-entry-points` exécuté : mise à jour des 3 entrées depuis la source unique.
- [2026-07-29 15:30] `npm run check:agent-entry-points` vert après génération.
- [2026-07-29 15:31] `npm run verify` vert (lint, build, 45 fichiers de test / 334 tests).

### Validation

-
