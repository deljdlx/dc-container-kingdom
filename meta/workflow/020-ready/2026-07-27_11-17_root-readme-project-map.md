---
id: 2026-07-27_11-17
title: README racine — courte carte des dossiers structurants
type: docs
branch:
created: 2026-07-27 11:17
ready: 2026-07-25 13:18
doing:
verify:
done:
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

- [ ] Section « Structure » au README racine, distinguant `src/` (code) et `meta/` (ressources).
- [ ] Liens relatifs valides (link-check).
- [ ] `npm run verify` vert.

## Journal

### Travail

-

### Vérification

-

### Validation

-
