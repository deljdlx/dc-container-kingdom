# Recipe — cycle d'un ticket (overview)

Le parcours d'un ticket sur le board `project/` (voir
[`../../project/README.md`](../../project/README.md)). **Une étape = une recipe** :

| Étape | Colonne | Recipe |
|---|---|---|
| Créer | → `000-backlog` | [ticket-create](ticket-create.md) |
| Spécifier | `000-backlog` → `020-ready` | [ticket-specify](ticket-specify.md) |
| Travailler | `020-ready` → `040-doing` | [ticket-work](ticket-work.md) |
| Vérifier | `040-doing` → `060-verify` | [ticket-verify](ticket-verify.md) |
| Valider & clore | `060-verify` → `080-done` | [ticket-validate](ticket-validate.md) |

Chaque transition = un `git mv` vers la colonne suivante.

## Règles transverses

- Chaque étape **date** son passage (frontmatter `ready`/`doing`/`verify`/`done`)
  et **documente ses itérations** (section `## Journal` du ticket, entrées datées).
- **Une** tâche en `040-doing` à la fois, idéalement.
- Une **branche par ticket** ; commiter / merger **sur demande** (voir
  [../conventions.md](../conventions.md)).
