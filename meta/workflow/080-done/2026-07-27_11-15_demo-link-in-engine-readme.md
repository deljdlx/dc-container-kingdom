---
id: 2026-07-27_11-15
title: Lien vers la démo dans le README du moteur
type: docs
branch: copilot/demo-link-in-engine-readme
created: 2026-07-27 11:15
ready: 2026-07-25 17:04
doing: 2026-07-25 17:04
verify: 2026-07-25 17:04
done: 2026-07-25 17:04
---

## Objectif

`src/engine/README.md` explique l'usage du moteur mais ne pointe pas vers la
**démo autonome**. Ajouter un lien pour la découvrabilité. Zéro impact runtime.

## Spécifications

_Trivial — pas de spec nécessaire._

## Contexte / liens

- `src/engine/README.md`
- La démo : `src/engine/demo/` (servie sous `http://localhost:5173/engine/demo/`).

## Definition of Done

- [x] `src/engine/README.md` mentionne et lie la démo autonome.

## Journal

### Travail

- [2026-07-25 17:04] Ajout d'un lien Markdown explicite vers la démo autonome dans `src/engine/README.md`, avec URL locale et pointeur vers le dossier source `src/engine/demo/`.

### Vérification

- [2026-07-25 17:04] `npm run verify` vert (lint + build + tests).

### Validation

- [2026-07-25 17:04] Relecture effectuée: DoD satisfaite et périmètre docs-only respecté (aucun impact runtime).
- [2026-07-25 17:04] Merge sur `main` réalisé via `git merge --no-ff copilot/demo-link-in-engine-readme` (commit de merge `af0f704`).
