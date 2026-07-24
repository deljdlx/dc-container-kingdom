# `project/` — board agentique (kanban en fichiers)

Un **kanban embarqué**, versionné dans le repo et pilotable par un agent :
l'avancement vit dans des **fichiers** (pas dans un outil externe), donc
n'importe quel agent ou humain reprend le contexte juste en lisant ce dossier.
**Auto-porteur.**

## Colonnes

Une tâche est un fichier `NNN-slug.md` (ou un dossier `NNN-slug/` si elle a des
artefacts) qu'on **déplace de colonne en colonne** avec `git mv` — ce qui trace
son avancement dans l'historique.

| Colonne | Rôle |
|---|---|
| **`000-todo/`** | Backlog **priorisé** (le haut = le plus prioritaire). |
| **`010-doing/`** | En cours — idéalement **une** tâche à la fois. |
| **`020-verify/`** | Implémentation faite, **en validation** : `npm run verify`, navigateur, review, durcissement. |
| **`030-done/`** | Terminé — archive du résultat (commit / merge noté). |

Les préfixes numériques **espacés** ordonnent les colonnes **et** laissent de la
place pour en insérer (`015-review`, `025-blocked`…).

## Cycle de vie d'une tâche

1. Prendre la tâche prioritaire de `000-todo/` → `git mv` vers `010-doing/`, créer
   la **branche dédiée** et la noter dans le frontmatter (`branch:`).
2. Travailler — s'appuyer sur les **recipes** (`../agents/recipes/`) et remplir le
   **Journal** de la tâche au fil de l'eau.
3. `npm run verify` vert → `git mv` vers `020-verify/`, puis valider (navigateur,
   review — voir la recipe `review-changes`).
4. Validé → merger sur `main`, `git mv` vers `030-done/`, noter le commit / merge.

## Créer une tâche

Copier [`TEMPLATE.md`](TEMPLATE.md) dans `000-todo/` sous le nom `NNN-slug.md`
(incrémenter `NNN`, `slug` court en kebab-case).

## Comment ça s'articule

- **Ce board** = le **QUOI** (état, priorité, avancement).
- **`../agents/recipes/`** = le **COMMENT** (playbooks des tâches récurrentes).
- **`../agents/`** (conventions, workflow, frontière moteur) = les **RÈGLES**.
- **`../documentation/`** = comment le **code** fonctionne.
