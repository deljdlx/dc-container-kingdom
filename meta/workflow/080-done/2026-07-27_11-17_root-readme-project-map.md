---
id: 2026-07-27_11-17
title: README racine — courte carte des dossiers structurants
type: docs
branch: docs/root-readme-structure
created: 2026-07-27 11:17
ready: 2026-07-25 13:18
doing: 2026-07-25 13:19
verify: 2026-07-25 13:20
done: 2026-07-25 13:21
---

## Objectif

Depuis la restructuration, la racine se lit en deux temps : `src/` (le code) et
`meta/` (les ressources de travail). Le README racine ne le dit nulle part.
Ajouter une courte section « Structure » qui pose ces deux niveaux et pointe les
sous-dossiers clés, pour qu'un nouvel arrivant (humain ou agent) s'oriente vite.

## Spécifications

Ajouter une section « 📁 Structure » (après « Documentation ») à deux entrées :

- **`src/`** — le code : `engine/` (moteur RPG réutilisable, voir
  `src/engine/README.md`) et `container-kingdom/` (l'app Docker).
- **`meta/`** — les ressources de travail : `agents/` (règles + recipes),
  `documentation/` (doc du code), `recipes/` (recettes projet), `workflow/`
  (board kanban en fichiers). Voir `meta/README.md`.

Rester concis (2 puces racine + sous-puces). Liens relatifs valides.

## Contexte / liens

- `README.md` (racine)

## Definition of Done

- [x] Section « Structure » au README racine, distinguant `src/` (code) et `meta/` (ressources).
- [x] Liens relatifs valides (link-check).
- [x] `npm run verify` vert.

## Journal

### Travail

- [2026-07-25 13:19] Section « 📁 Structure » ajoutée au README racine (après
  « Documentation »), rédigée en anglais comme le reste du fichier. Deux entrées :
  `src/` (code : engine + container-kingdom) et `meta/` (agents, documentation,
  recipes, workflow), avec liens relatifs vers les sous-dossiers / README.

### Vérification

- [2026-07-25 13:20] Link-check des 7 liens de la nouvelle section : tous
  résolvent (`src/`, `src/engine/README.md`, `meta/README.md`, `meta/agents/`,
  `meta/documentation/`, `meta/recipes/`, `meta/workflow/`). `npm run verify`
  vert (lint + build + 116 tests). Aucun résidu de debug (doc pure).

### Validation

- [2026-07-25 13:21] Review d'acceptation OK : conforme aux conventions (README
  en anglais, commits FR, liens valides), DoD couverte. Mergé sur `main` en
  `--no-ff` (merge `0b78bcf`) ; ticket clos en `080-done`.
