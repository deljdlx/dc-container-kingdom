# Recipe — spécifier un ticket (`000-backlog` → `020-ready`)

Cadrer une tâche avant de la prendre — pour qu'elle soit **prête à démarrer**.

## Étapes

1. Remplir / consolider la section **Spécifications** (voir ci-dessous) et affiner
   la **Definition of Done** (critères concrets, vérifiables).
2. Renseigner `ready:` (date/heure) dans le frontmatter.
3. `git mv` le ticket vers `meta/workflow/020-ready/`.

## Ce que couvre une spec (à doser selon la tâche)

- **Fonctionnel** — le *quoi*, côté usage : comportement attendu, cas, états d'UI,
  entrées / sorties.
- **Technique** — le *comment* : composants / fichiers touchés, flux de données,
  surface d'API, contraintes (frontière moteur, mobile-first, perf), dépendances.
- **Schéma** *(si ça clarifie)* — un diagramme **mermaid** (flux, machine à états,
  archi) ; rendu nativement par GitHub, comme les schémas de `meta/documentation/`.
- **Risques / questions ouvertes** — points à trancher, hypothèses.

> **Doser** : une tâche triviale tient en deux bullets — voire aucune spec (elle
> passe quand même en `020-ready`, `ready:` daté) ; une feature mérite fonctionnel
> + technique (+ schéma). Ne pas gonfler pour gonfler — la **DoD** reste le contrat
> vérifiable.

> *specify* est du **bookkeeping de board** : pas encore de branche, la transition
> se commite sur `main`. La branche dédiée naît à l'étape [work](ticket-work.md).
