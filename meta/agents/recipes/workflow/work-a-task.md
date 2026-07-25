# Recipe — cycle d'un ticket (overview)

Le parcours d'un ticket sur le board `meta/` (voir
[`../../../README.md`](../../../README.md)). **Une étape = une recipe** :

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
- **Colonnes actives vs repos** : une colonne **active** (`040-doing`, `060-verify`)
  s'entre **au début** de son activité — on `git mv` le ticket *avant* de travailler
  / vérifier, pour que le board reflète l'état réel. Une colonne **de repos**
  (`020-ready`, `080-done`) s'entre à la **fin** de l'étape. La date de transition =
  l'entrée dans la colonne.
- **Une** tâche en `040-doing` à la fois, idéalement.
- Une **branche par ticket**.
- **Bookkeeping vs code** : le **bookkeeping de board** (créer un ticket, transitions
  de colonnes sur `main`) se commite **au fil de l'eau** — c'est la mécanique du
  board. Le **« sur demande »** protège les **merges sur `main`** et les **push**,
  pas ces commits d'administration (voir [../conventions.md](../../conventions.md)).

## Topologie git

- Le **board** (`meta/workflow/`) vit sur `main` : les transitions *create*,
  *specify* et *done* sont du **bookkeeping** commité sur `main` (elles ne touchent
  que le board, jamais le code).
- Le **code** vit sur une **branche dédiée**, créée à l'étape *work* et qui porte
  *work* + *verify* (implémentation, `verify`, journal).
- *validate* **merge** la branche sur `main` (`--no-ff`), **puis** clôt le ticket
  sur `main` : la transition `done` est **post-merge**, ce qui permet d'y citer le
  **hash du merge**.

Ainsi le fichier-ticket n'est édité que sur **une seule ligne d'historique à la
fois** (branche *ou* `main`) — pas de divergence, pas de conflit.
