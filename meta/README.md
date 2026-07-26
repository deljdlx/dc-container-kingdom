# `meta/` — board agentique (kanban en fichiers)

Un **kanban embarqué**, versionné dans le repo et pilotable par un agent :
l'avancement vit dans des **fichiers** (pas dans un outil externe), donc
n'importe quel agent ou humain reprend le contexte juste en lisant ce dossier.
**Auto-porteur.**

## Colonnes

Une tâche est un fichier `YYYY-MM-DD_HH-MM_titre.md` (ou un dossier si elle a des
artefacts) qu'on **déplace de colonne en colonne** avec `git mv` — ce qui trace
son avancement dans l'historique.

| Colonne | Rôle |
|---|---|
| **`000-backlog/`** | Backlog **priorisé** (le haut = le plus prioritaire). |
| **`020-ready/`** | **Spécifiée** et prête à démarrer (specs écrites si besoin, `ready:` daté). |
| **`040-doing/`** | En cours — idéalement **une** tâche à la fois. |
| **`060-verify/`** | Implémentation faite, **en validation** : `npm run verify`, navigateur, review, durcissement. |
| **`080-done/`** | Terminé — archive du résultat (commit / merge noté). |
| **`100-follow-up/`** | **Hors pipeline** — boîte de **candidats** (pas de tickets) émis à la clôture, triés vers `000-backlog/`. |

Les préfixes numériques **espacés** (pas de 20) ordonnent les colonnes **et**
laissent de la place pour en insérer (`010-…`, `030-…`, `050-…`, `070-…`).

`100-follow-up/` est **détaché** de la plage `000` → `080` à dessein : ce n'est pas
l'étape qui suit `080-done`, c'est une **boîte de sortie** qui **réalimente**
`000-backlog`. Un ticket ne s'y déplace jamais ; elle ne reçoit que des
**candidats** — des notes courtes, sans frontmatter, bon marché à écrire comme à
jeter. Elle existe pour protéger la propriété la plus fragile du backlog : être
**priorisé**. Voir [ticket-follow-up](agents/recipes/workflow/ticket-follow-up.md) (qui
la remplit) et [follow-up-triage](agents/recipes/workflow/follow-up-triage.md) (qui la
vide).

## Cycle de vie d'une tâche

Chaque étape a sa recipe (détail dans [`work-a-task`](agents/recipes/workflow/work-a-task.md)).
Chaque transition **date** son passage (frontmatter) et **documente ses itérations**
(section `## Journal` du ticket) :

1. **Créer** → `000-backlog/` — [ticket-create](agents/recipes/workflow/ticket-create.md).
2. **Spécifier** → `020-ready/` — specs + `ready:` — [ticket-specify](agents/recipes/workflow/ticket-specify.md).
3. **Travailler** → `040-doing/` — branche + `doing:` — [ticket-work](agents/recipes/workflow/ticket-work.md).
4. **Vérifier** → `060-verify/` — `npm run verify` + `verify:` — [ticket-verify](agents/recipes/workflow/ticket-verify.md).
5. **Valider & clore** → `080-done/` — review + merge + `done:` — [ticket-validate](agents/recipes/workflow/ticket-validate.md).
6. **Suite** → rubrique `## Suite` du ticket (+ candidats en `100-follow-up/` si
   besoin) — [ticket-follow-up](agents/recipes/workflow/ticket-follow-up.md). Ces
   candidats sont triés au **démarrage de la tâche suivante** —
   [follow-up-triage](agents/recipes/workflow/follow-up-triage.md).

## Créer une tâche

Copier [`TEMPLATE.md`](workflow/TEMPLATE.md) dans `000-backlog/` sous le nom
`YYYY-MM-DD_HH-MM_titre.md` (heure de création ; `titre` court en kebab-case).
Voir [ticket-create](agents/recipes/workflow/ticket-create.md).

## Comment ça s'articule

- **Ce board** = le **QUOI** (état, priorité, avancement).
- **`agents/recipes/`** = le **COMMENT générique** (méthode réutilisable) ;
  **[`recipes/`](recipes/)** = le **COMMENT projet** (patterns Container Kingdom).
- **`agents/`** (conventions, workflow, frontière moteur) = les **RÈGLES**.
- **`documentation/`** = comment le **code** fonctionne.
